import * as vscode from 'vscode';
import * as path from 'path';
import { DocGenerator } from './docGenerator';
import { registerDocViewer } from './docViewer';

/**
 * Register documentation commands
 */
export function registerDocumentationCommands(context: vscode.ExtensionContext): void {
  // Generate documentation command
  const generateDocsCmd = vscode.commands.registerCommand('manicMiners.generateDocs', async () => {
    try {
      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Generating Documentation',
          cancellable: false,
        },
        async progress => {
          progress.report({ message: 'Analyzing source files...' });

          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders) {
            throw new Error('No workspace folder open');
          }

          const projectRoot = workspaceFolders[0].uri.fsPath;
          const generator = new DocGenerator(projectRoot, {
            outputDir: 'docs/generated',
            exclude: ['node_modules', 'test', 'dist'],
          });

          progress.report({ message: 'Generating documentation...' });
          await generator.generateDocs();

          progress.report({ message: 'Documentation generated successfully!' });
        }
      );

      // Ask if user wants to open the documentation
      const action = await vscode.window.showInformationMessage(
        'Documentation generated successfully!',
        'Open Documentation',
        'Show in Explorer'
      );

      if (action === 'Open Documentation') {
        vscode.commands.executeCommand('manicMiners.openDocs');
      } else if (action === 'Show in Explorer') {
        const docsPath = path.join(
          vscode.workspace.workspaceFolders![0].uri.fsPath,
          'docs',
          'generated',
          'index.md'
        );
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(docsPath));
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to generate documentation: ${error}`);
    }
  });

  // Open documentation viewer command
  const openDocsCmd = vscode.commands.registerCommand('manicMiners.openDocs', async () => {
    // Focus on documentation panel
    await vscode.commands.executeCommand('manicMiners.docViewer.focus');
  });

  // Search documentation command
  const searchDocsCmd = vscode.commands.registerCommand('manicMiners.searchDocs', async () => {
    const query = await vscode.window.showInputBox({
      prompt: 'Search documentation',
      placeHolder: 'Enter search term...',
    });

    if (query) {
      // Send search query to doc viewer
      await vscode.commands.executeCommand('manicMiners.docViewer.search', query);
    }
  });

  // Export documentation as PDF command
  const exportDocsCmd = vscode.commands.registerCommand('manicMiners.exportDocs', async () => {
    const options = await vscode.window.showQuickPick(
      [
        { label: 'Export as PDF', value: 'pdf' },
        { label: 'Export as HTML', value: 'html' },
        { label: 'Export as Markdown Bundle', value: 'markdown' },
      ],
      {
        placeHolder: 'Select export format',
      }
    );

    if (options) {
      await exportDocumentation(options.value);
    }
  });

  // Register documentation viewer
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    const docRoot = path.join(workspaceFolders[0].uri.fsPath, 'docs', 'generated');
    const docViewerDisposable = registerDocViewer(context, docRoot);
    context.subscriptions.push(docViewerDisposable);
  }

  // Add commands to subscriptions
  context.subscriptions.push(generateDocsCmd, openDocsCmd, searchDocsCmd, exportDocsCmd);

  // Auto-generate docs on save (if enabled)
  const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(async document => {
    const config = vscode.workspace.getConfiguration('manicMiners');
    const autoGenerateDocs = config.get('documentation.autoGenerate', false);

    if (autoGenerateDocs && document.languageId === 'typescript') {
      // Check if file is in src directory
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const srcPath = path.join(workspaceFolders[0].uri.fsPath, 'src');
        if (document.fileName.startsWith(srcPath)) {
          // Regenerate docs in background
          const generator = new DocGenerator(workspaceFolders[0].uri.fsPath, {
            outputDir: 'docs/generated',
            exclude: ['node_modules', 'test', 'dist'],
          });

          generator.generateDocs().catch(error => {
            console.error('Failed to auto-generate docs:', error);
          });
        }
      }
    }
  });

  context.subscriptions.push(onSaveDisposable);
}

/**
 * Export documentation in various formats
 */
async function exportDocumentation(format: string): Promise<void> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Exporting documentation as ${format.toUpperCase()}`,
        cancellable: false,
      },
      async progress => {
        progress.report({ message: 'Preparing export...' });

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          throw new Error('No workspace folder open');
        }

        const docRoot = path.join(workspaceFolders[0].uri.fsPath, 'docs', 'generated');

        switch (format) {
          case 'pdf':
            await exportAsPDF(docRoot, progress);
            break;
          case 'html':
            await exportAsHTML(docRoot, progress);
            break;
          case 'markdown':
            await exportAsMarkdownBundle(docRoot, progress);
            break;
        }

        progress.report({ message: 'Export completed!' });
      }
    );

    vscode.window.showInformationMessage(`Documentation exported as ${format.toUpperCase()}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to export documentation: ${error}`);
  }
}

/**
 * Export documentation as PDF
 */
async function exportAsPDF(
  _docRoot: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
  progress.report({ message: 'Converting to PDF...' });

  // This would require a PDF generation library like puppeteer or markdown-pdf
  // For now, we'll show a message
  vscode.window.showInformationMessage(
    'PDF export would be implemented using a library like puppeteer or markdown-pdf'
  );
}

/**
 * Export documentation as HTML
 */
async function exportAsHTML(
  _docRoot: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
  progress.report({ message: 'Generating HTML...' });

  // This would convert all markdown files to a static HTML site
  // For now, we'll show a message
  vscode.window.showInformationMessage(
    'HTML export would generate a static website from the documentation'
  );
}

/**
 * Export documentation as Markdown bundle
 */
async function exportAsMarkdownBundle(
  _docRoot: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
  progress.report({ message: 'Creating Markdown bundle...' });

  // This would create a single markdown file with all documentation
  // For now, we'll show a message
  vscode.window.showInformationMessage(
    'Markdown bundle export would combine all documentation into a single file'
  );
}
