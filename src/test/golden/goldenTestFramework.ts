import * as fs from 'fs';
import * as path from 'path';
import { DatFileParser } from '../../parser/datFileParser';
import { DatFileValidator } from '../../validation/datFileValidator';
import { EnhancedScriptValidator } from '../../validation/enhancedScriptValidator';

/**
 * Golden file testing framework inspired by groundhog
 * Ensures parser output remains consistent across changes
 */

export interface GoldenTestResult {
  passed: boolean;
  testName: string;
  differences?: string[];
  error?: string;
}

export interface GoldenTestOptions {
  updateGoldens?: boolean;
  verbose?: boolean;
  onlyChanged?: boolean;
}

/**
 * Golden test framework for DAT files
 */
export class GoldenTestFramework {
  private goldenDir: string;
  private testMapsDir: string;
  private outputDir: string;
  private options: GoldenTestOptions;

  constructor(
    goldenDir: string,
    testMapsDir: string,
    outputDir: string,
    options: GoldenTestOptions = {}
  ) {
    this.goldenDir = goldenDir;
    this.testMapsDir = testMapsDir;
    this.outputDir = outputDir;
    this.options = options;

    // Ensure directories exist
    this.ensureDirectoryExists(goldenDir);
    this.ensureDirectoryExists(outputDir);
  }

  /**
   * Run all golden tests
   */
  public async runAllTests(): Promise<GoldenTestResult[]> {
    const results: GoldenTestResult[] = [];
    const testFiles = this.getTestFiles();

    for (const testFile of testFiles) {
      const result = await this.runTest(testFile);
      results.push(result);

      if (this.options.verbose) {
        console.log(`${result.passed ? '✓' : '✗'} ${result.testName}`);
        if (!result.passed && result.differences) {
          result.differences.forEach(diff => console.log(`  ${diff}`));
        }
      }
    }

    return results;
  }

  /**
   * Run a single golden test
   */
  public async runTest(testFileName: string): Promise<GoldenTestResult> {
    const testName = path.basename(testFileName, '.dat');

    try {
      // Read test file
      const testFilePath = path.join(this.testMapsDir, testFileName);
      const content = fs.readFileSync(testFilePath, 'utf-8');

      // Parse the file
      const parser = new DatFileParser(content);
      const datFile = parser.parse();

      // Validate the file
      const validator = new DatFileValidator();
      const validationErrors = validator.validate(datFile);

      // Enhanced script validation if script exists
      let scriptValidationErrors: any[] = [];
      if (datFile.script) {
        const scriptValidator = new EnhancedScriptValidator();
        scriptValidationErrors = scriptValidator.validate(datFile.script);
      }

      // Generate output
      const output = this.generateTestOutput(datFile, validationErrors, scriptValidationErrors);

      // Compare with golden
      const goldenPath = path.join(this.goldenDir, `${testName}.golden`);
      const outputPath = path.join(this.outputDir, `${testName}.output`);

      // Write output for debugging
      fs.writeFileSync(outputPath, output);

      if (this.options.updateGoldens || !fs.existsSync(goldenPath)) {
        // Update golden file
        fs.writeFileSync(goldenPath, output);
        return {
          passed: true,
          testName,
          differences: this.options.updateGoldens
            ? ['Golden file updated']
            : ['Golden file created'],
        };
      }

      // Compare with existing golden
      const golden = fs.readFileSync(goldenPath, 'utf-8');
      const differences = this.compareOutputs(output, golden);

      return {
        passed: differences.length === 0,
        testName,
        differences: differences.length > 0 ? differences : undefined,
      };
    } catch (error) {
      return {
        passed: false,
        testName,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate test output for comparison
   */
  private generateTestOutput(
    datFile: any,
    validationErrors: any[],
    scriptValidationErrors: any[]
  ): string {
    const output: string[] = [];

    // Header
    output.push('=== PARSED DAT FILE ===');
    output.push('');

    // Info section
    if (datFile.info) {
      output.push('[INFO]');
      output.push(`rowcount: ${datFile.info.rowcount}`);
      output.push(`colcount: ${datFile.info.colcount}`);
      output.push(`biome: ${datFile.info.biome || 'not specified'}`);
      output.push(`creator: ${datFile.info.creator || 'not specified'}`);
      output.push(`levelname: ${datFile.info.levelname || 'not specified'}`);
      output.push('');
    }

    // Tiles summary
    if (datFile.tiles) {
      output.push('[TILES]');
      output.push(`dimensions: ${datFile.tiles.length}x${datFile.tiles[0]?.length || 0}`);
      const uniqueTiles = new Set(datFile.tiles.flat());
      output.push(`unique tiles: ${uniqueTiles.size}`);
      output.push(
        `tile IDs: ${Array.from(uniqueTiles)
          .sort((a, b) => Number(a) - Number(b))
          .join(', ')}`
      );
      output.push('');
    }

    // Resources
    if (datFile.resources) {
      output.push('[RESOURCES]');
      const crystalCount =
        datFile.resources.crystals?.flat().filter((x: number) => x > 0).length || 0;
      const oreCount = datFile.resources.ore?.flat().filter((x: number) => x > 0).length || 0;
      output.push(`crystals: ${crystalCount} tiles`);
      output.push(`ore: ${oreCount} tiles`);
      output.push('');
    }

    // Objectives
    if (datFile.objectives && datFile.objectives.length > 0) {
      output.push('[OBJECTIVES]');
      datFile.objectives.forEach((obj: any) => {
        output.push(`${obj.type}: ${obj.condition}`);
      });
      output.push('');
    }

    // Entities
    const entitySections = ['buildings', 'vehicles', 'creatures', 'miners'];
    entitySections.forEach(section => {
      if (datFile[section] && datFile[section].length > 0) {
        output.push(`[${section.toUpperCase()}]`);
        output.push(`count: ${datFile[section].length}`);
        const types = datFile[section].map((e: any) => e.type);
        const uniqueTypes = [...new Set(types)];
        uniqueTypes.forEach(type => {
          const count = types.filter((t: string) => t === type).length;
          output.push(`  ${type}: ${count}`);
        });
        output.push('');
      }
    });

    // Script
    if (datFile.script) {
      output.push('[SCRIPT]');
      output.push(`variables: ${datFile.script.variables.size}`);
      output.push(`events: ${datFile.script.events.length}`);

      // Count command types
      const commandCounts = new Map<string, number>();
      datFile.script.events.forEach((event: any) => {
        event.commands.forEach((cmd: any) => {
          const count = commandCounts.get(cmd.command) || 0;
          commandCounts.set(cmd.command, count + 1);
        });
      });

      output.push('commands:');
      Array.from(commandCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([cmd, count]) => {
          output.push(`  ${cmd}: ${count}`);
        });
      output.push('');
    }

    // Validation results
    output.push('[VALIDATION]');
    output.push(`errors: ${validationErrors.filter(e => e.severity === 'error').length}`);
    output.push(`warnings: ${validationErrors.filter(e => e.severity === 'warning').length}`);

    if (scriptValidationErrors.length > 0) {
      output.push(
        `script errors: ${scriptValidationErrors.filter(e => e.severity === 'error').length}`
      );
      output.push(
        `script warnings: ${scriptValidationErrors.filter(e => e.severity === 'warning').length}`
      );
    }

    // List first few errors/warnings
    const allErrors = [...validationErrors, ...scriptValidationErrors]
      .filter(e => e.severity === 'error')
      .slice(0, 5);

    if (allErrors.length > 0) {
      output.push('');
      output.push('First errors:');
      allErrors.forEach(err => {
        output.push(`  [${err.section}] ${err.message}`);
      });
    }

    return output.join('\n');
  }

  /**
   * Compare two outputs and return differences
   */
  private compareOutputs(actual: string, expected: string): string[] {
    const actualLines = actual.split('\n');
    const expectedLines = expected.split('\n');
    const differences: string[] = [];

    const maxLines = Math.max(actualLines.length, expectedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const actualLine = actualLines[i] || '';
      const expectedLine = expectedLines[i] || '';

      if (actualLine !== expectedLine) {
        differences.push(`Line ${i + 1}:`);
        differences.push(`  Expected: ${expectedLine}`);
        differences.push(`  Actual:   ${actualLine}`);
      }
    }

    return differences;
  }

  /**
   * Get all test files
   */
  private getTestFiles(): string[] {
    if (!fs.existsSync(this.testMapsDir)) {
      return [];
    }

    return fs
      .readdirSync(this.testMapsDir)
      .filter(file => file.endsWith('.dat'))
      .sort();
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Generate summary report
   */
  public generateSummary(results: GoldenTestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    const summary: string[] = [];
    summary.push('=== GOLDEN TEST SUMMARY ===');
    summary.push(`Total tests: ${total}`);
    summary.push(`Passed: ${passed}`);
    summary.push(`Failed: ${failed}`);
    summary.push('');

    if (failed > 0) {
      summary.push('Failed tests:');
      results
        .filter(r => !r.passed)
        .forEach(r => {
          summary.push(`  - ${r.testName}`);
          if (r.error) {
            summary.push(`    Error: ${r.error}`);
          } else if (r.differences && r.differences.length > 0) {
            summary.push(`    ${r.differences.length} differences found`);
          }
        });
    }

    return summary.join('\n');
  }
}
