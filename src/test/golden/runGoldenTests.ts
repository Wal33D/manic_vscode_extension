#!/usr/bin/env node
import * as path from 'path';
import { GoldenTestFramework } from './goldenTestFramework';

/**
 * Command-line runner for golden tests
 */

// Parse command line arguments
const args = process.argv.slice(2);
const updateGoldens = args.includes('--update-goldens') || process.env.UPDATE_GOLDENS === 'true';
const verbose = args.includes('--verbose') || args.includes('-v');
const specificTest = args.find(arg => arg.endsWith('.dat'));

// Set up paths
const projectRoot = path.join(__dirname, '..', '..', '..');
const goldenDir = path.join(projectRoot, 'src', 'test', 'golden', 'goldens');
const testMapsDir = path.join(projectRoot, 'src', 'test', 'golden', 'test-maps');
const outputDir = path.join(projectRoot, 'src', 'test', 'golden', 'output');

// Create test framework
const framework = new GoldenTestFramework(goldenDir, testMapsDir, outputDir, {
  updateGoldens,
  verbose,
});

// Run tests
async function runTests() {
  console.log('🧪 Running golden tests...');
  console.log(`Golden directory: ${goldenDir}`);
  console.log(`Test maps directory: ${testMapsDir}`);
  console.log(`Update goldens: ${updateGoldens}`);
  console.log('');

  let results;

  if (specificTest) {
    // Run single test
    console.log(`Running single test: ${specificTest}`);
    const result = await framework.runTest(specificTest);
    results = [result];
  } else {
    // Run all tests
    results = await framework.runAllTests();
  }

  // Generate summary
  const summary = framework.generateSummary(results);
  console.log('');
  console.log(summary);

  // Exit with appropriate code
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Handle errors
runTests().catch(error => {
  console.error('Error running golden tests:', error);
  process.exit(1);
});
