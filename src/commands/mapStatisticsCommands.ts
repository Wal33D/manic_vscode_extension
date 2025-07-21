/**
 * Commands for map statistics analysis
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import { DatFileParser } from '../parser/datFileParser';
import { MapStatisticsAnalyzer } from '../statistics/mapStatistics';
import { HeatmapRenderer, HeatmapOptions } from '../statistics/heatmapRenderer';

/**
 * Register map statistics commands
 */
export function registerMapStatisticsCommands(context: vscode.ExtensionContext): void {
  // Show map statistics command
  const showStatsCmd = vscode.commands.registerCommand(
    'manicMiners.showMapStatistics',
    async () => {
      await showMapStatistics(context);
    }
  );

  // Show heatmap command
  const showHeatmapCmd = vscode.commands.registerCommand(
    'manicMiners.showStatisticsHeatmap',
    async () => {
      await showStatisticsHeatmap(context);
    }
  );

  // Generate statistics report command
  const generateReportCmd = vscode.commands.registerCommand(
    'manicMiners.generateStatisticsReport',
    async () => {
      await generateStatisticsReport();
    }
  );

  context.subscriptions.push(showStatsCmd, showHeatmapCmd, generateReportCmd);
}

/**
 * Show map statistics in output channel
 */
async function showMapStatistics(_context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !editor.document.fileName.endsWith('.dat')) {
    vscode.window.showErrorMessage('Please open a .dat file to analyze');
    return;
  }

  try {
    // Parse the DAT file
    const content = editor.document.getText();
    const parser = new DatFileParser(content);
    const datFile = parser.parse();

    // Analyze statistics
    const analyzer = new MapStatisticsAnalyzer(datFile);
    const stats = analyzer.analyzeMap();

    // Create output channel
    const outputChannel = vscode.window.createOutputChannel('Map Statistics');
    outputChannel.clear();
    outputChannel.show();

    // Generate and display report
    const report = analyzer.generateReport(stats);
    outputChannel.appendLine(report);

    // Show summary notification
    vscode.window.showInformationMessage(
      `Map Analysis Complete: ${stats.difficulty.overall.toUpperCase()} difficulty, ` +
        `${stats.accessibility.overallScore.toFixed(0)}/100 accessibility score`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to analyze map: ${error}`);
  }
}

/**
 * Show statistics heatmap in webview
 */
async function showStatisticsHeatmap(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !editor.document.fileName.endsWith('.dat')) {
    vscode.window.showErrorMessage('Please open a .dat file to analyze');
    return;
  }

  try {
    // Parse the DAT file
    const content = editor.document.getText();
    const parser = new DatFileParser(content);
    const datFile = parser.parse();

    // Analyze statistics
    const analyzer = new MapStatisticsAnalyzer(datFile);
    const stats = analyzer.analyzeMap();

    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
      'mapStatisticsHeatmap',
      'Map Statistics Heatmap',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // Initial options
    const options: HeatmapOptions = {
      type: 'resource',
      showGrid: true,
      showValues: false,
      opacity: 0.8,
    };

    // Render heatmap
    const renderer = new HeatmapRenderer(stats);
    panel.webview.html = renderer.renderHeatmap(options);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'updateOptions':
            Object.assign(options, message.options);
            panel.webview.html = renderer.renderHeatmap(options);
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create heatmap: ${error}`);
  }
}

/**
 * Generate and save statistics report
 */
async function generateStatisticsReport(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !editor.document.fileName.endsWith('.dat')) {
    vscode.window.showErrorMessage('Please open a .dat file to analyze');
    return;
  }

  try {
    // Parse the DAT file
    const content = editor.document.getText();
    const parser = new DatFileParser(content);
    const datFile = parser.parse();

    // Analyze statistics
    const analyzer = new MapStatisticsAnalyzer(datFile);
    const stats = analyzer.analyzeMap();

    // Generate detailed report
    const report = generateDetailedReport(stats, datFile);

    // Ask where to save
    const defaultPath = editor.document.fileName.replace('.dat', '_statistics.md');
    const savePath = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultPath),
      filters: {
        Markdown: ['md'],
        Text: ['txt'],
      },
    });

    if (savePath) {
      fs.writeFileSync(savePath.fsPath, report);

      // Open the report
      const doc = await vscode.workspace.openTextDocument(savePath);
      await vscode.window.showTextDocument(doc);

      vscode.window.showInformationMessage('Statistics report saved successfully');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to generate report: ${error}`);
  }
}

/**
 * Generate detailed markdown report
 */
function generateDetailedReport(stats: any, datFile: any): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Map Statistics Report`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Map: ${datFile.info?.levelname || 'Unnamed'}`);
  lines.push('');

  // Overview
  lines.push('## Overview');
  lines.push(`- **Dimensions**: ${stats.dimensions.width}x${stats.dimensions.height}`);
  lines.push(`- **Total Tiles**: ${stats.dimensions.width * stats.dimensions.height}`);
  lines.push(`- **Difficulty**: ${stats.difficulty.overall.toUpperCase()}`);
  lines.push(`- **Accessibility Score**: ${stats.accessibility.overallScore.toFixed(0)}/100`);
  lines.push(`- **Balance**: ${stats.balance.isBalanced ? '✅ Good' : '⚠️ Needs Work'}`);
  lines.push('');

  // Tile Distribution
  lines.push('## Tile Distribution');
  lines.push('| Tile Type | Count | Percentage |');
  lines.push('|-----------|-------|------------|');
  stats.tileDistribution.slice(0, 10).forEach((dist: any) => {
    lines.push(`| ${dist.name} | ${dist.count} | ${dist.percentage.toFixed(1)}% |`);
  });
  lines.push('');

  // Resource Analysis
  lines.push('## Resource Analysis');
  for (const [type, dist] of stats.resourceDistribution) {
    lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    lines.push(`- **Total Yield**: ${dist.totalYield}`);
    lines.push(`- **Tile Count**: ${dist.tileCount}`);
    lines.push(`- **Average per Tile**: ${dist.averagePerTile.toFixed(1)}`);
    lines.push(`- **Clusters**: ${dist.clusters.length}`);

    if (dist.clusters.length > 0) {
      lines.push('');
      lines.push('Top clusters by yield:');
      dist.clusters
        .sort((a: any, b: any) => b.totalYield - a.totalYield)
        .slice(0, 5)
        .forEach((cluster: any, i: number) => {
          lines.push(
            `${i + 1}. Position (${cluster.center.x}, ${cluster.center.y}) - Yield: ${cluster.totalYield}`
          );
        });
    }
    lines.push('');
  }

  // Accessibility Analysis
  lines.push('## Accessibility Analysis');
  lines.push(`- **Overall Score**: ${stats.accessibility.overallScore.toFixed(0)}/100`);
  lines.push(`- **Reachable Area**: ${stats.accessibility.reachableArea.toFixed(1)}%`);
  lines.push(`- **Average Path Width**: ${stats.accessibility.averagePathWidth.toFixed(1)} tiles`);
  lines.push(`- **Chokepoints**: ${stats.accessibility.chokepointCount}`);
  lines.push(`- **Isolated Regions**: ${stats.accessibility.isolatedRegions.length}`);

  if (stats.accessibility.isolatedRegions.length > 0) {
    lines.push('');
    lines.push('Isolated regions:');
    stats.accessibility.isolatedRegions.forEach((region: any, i: number) => {
      lines.push(
        `${i + 1}. Position (${region.center.x}, ${region.center.y}) - Size: ${region.tiles} tiles`
      );
    });
  }
  lines.push('');

  // Difficulty Breakdown
  lines.push('## Difficulty Analysis');
  lines.push(`Overall difficulty: **${stats.difficulty.overall.toUpperCase()}**`);
  lines.push('');
  lines.push('Factor scores (0-100, higher is easier):');
  lines.push('| Factor | Score | Rating |');
  lines.push('|--------|-------|--------|');
  Object.entries(stats.difficulty.factors).forEach(([factor, score]: [string, any]) => {
    let rating = '';
    if (score > 75) {
      rating = '✅ Easy';
    } else if (score > 50) {
      rating = '⚠️ Medium';
    } else if (score > 25) {
      rating = '🔴 Hard';
    } else {
      rating = '💀 Extreme';
    }

    lines.push(`| ${factor} | ${score.toFixed(0)} | ${rating} |`);
  });

  if (stats.difficulty.recommendations.length > 0) {
    lines.push('');
    lines.push('### Recommendations');
    stats.difficulty.recommendations.forEach((rec: string) => {
      lines.push(`- ${rec}`);
    });
  }
  lines.push('');

  // Balance Analysis
  lines.push('## Balance Analysis');
  lines.push(
    `Status: ${stats.balance.isBalanced ? '**✅ Well Balanced**' : '**⚠️ Needs Adjustment**'}`
  );
  lines.push('');
  lines.push('### Metrics');
  lines.push(
    `- **Resource to Hazard Ratio**: ${stats.balance.metrics.resourceToHazardRatio.toFixed(2)}`
  );
  lines.push(`- **Open to Wall Ratio**: ${stats.balance.metrics.openToWallRatio.toFixed(2)}`);
  lines.push(`- **Path Complexity**: ${stats.balance.metrics.pathComplexity.toFixed(0)}/100`);

  if (stats.balance.issues.length > 0) {
    lines.push('');
    lines.push('### Issues');
    stats.balance.issues.forEach((issue: string) => {
      lines.push(`- ❌ ${issue}`);
    });
  }

  if (stats.balance.suggestions.length > 0) {
    lines.push('');
    lines.push('### Suggestions');
    stats.balance.suggestions.forEach((suggestion: string) => {
      lines.push(`- 💡 ${suggestion}`);
    });
  }
  lines.push('');

  // Summary
  lines.push('## Summary');
  const summaryPoints: string[] = [];

  if (stats.difficulty.overall === 'extreme') {
    summaryPoints.push('This map is extremely challenging and may frustrate players');
  } else if (stats.difficulty.overall === 'easy') {
    summaryPoints.push('This map is suitable for beginners and casual play');
  }

  if (stats.accessibility.overallScore < 50) {
    summaryPoints.push('Poor accessibility may make navigation difficult');
  }

  if (!stats.balance.isBalanced) {
    summaryPoints.push('Balance issues should be addressed for better gameplay');
  }

  if (stats.accessibility.isolatedRegions.length > 3) {
    summaryPoints.push('Multiple isolated regions may confuse players');
  }

  if (summaryPoints.length === 0) {
    summaryPoints.push('This map appears to be well-designed with good balance');
  }

  summaryPoints.forEach(point => {
    lines.push(`- ${point}`);
  });

  return lines.join('\n');
}
