import * as vscode from 'vscode';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  category: string;
  fix?: {
    label: string;
    command: string;
    arguments?: unknown[];
  };
}

type ValidationItem = ValidationStatus | ValidationCategory | ValidationIssueItem;

export class ValidationProvider implements vscode.TreeDataProvider<ValidationItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ValidationItem | undefined | null | void> =
    new vscode.EventEmitter<ValidationItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ValidationItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private issues: ValidationIssue[] = [];
  private lastValidation: Date | undefined;

  constructor(_context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateValidation(issues: ValidationIssue[]): void {
    this.issues = issues;
    this.lastValidation = new Date();
    this.refresh();

    // Update status bar with validation summary
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    vscode.commands.executeCommand('manicMiners.updateStatusBar', {
      validation:
        errorCount > 0
          ? `$(error) ${errorCount}`
          : warningCount > 0
            ? `$(warning) ${warningCount}`
            : '$(check) Valid',
    });
  }

  getTreeItem(element: ValidationItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ValidationItem): Thenable<ValidationItem[]> {
    if (!element) {
      if (this.issues.length === 0) {
        // No issues
        return Promise.resolve([
          new ValidationStatus(
            this.lastValidation ? 'All checks passed' : 'Click to run validation',
            'success',
            this.lastValidation
          ),
        ]);
      }

      // Group issues by category
      const categories = new Map<string, ValidationIssue[]>();
      this.issues.forEach(issue => {
        const list = categories.get(issue.category) || [];
        list.push(issue);
        categories.set(issue.category, list);
      });

      // Create category items
      return Promise.resolve(
        Array.from(categories.entries()).map(
          ([category, issues]) => new ValidationCategory(category, issues)
        )
      );
    } else if (element instanceof ValidationCategory) {
      // Issues within a category
      return Promise.resolve(element.issues.map(issue => new ValidationIssueItem(issue)));
    }

    return Promise.resolve([]);
  }

  clearValidation(): void {
    this.issues = [];
    this.refresh();
  }
}

class ValidationStatus extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly status: 'success' | 'pending',
    public readonly timestamp?: Date
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.contextValue = 'validationStatus';
    this.iconPath = new vscode.ThemeIcon(status === 'success' ? 'pass-filled' : 'play');

    if (timestamp) {
      this.description = `Last run: ${timestamp.toLocaleTimeString()}`;
    }

    this.command = {
      command: 'manicMiners.runValidation',
      title: 'Run Validation',
    };
  }
}

class ValidationCategory extends vscode.TreeItem {
  constructor(
    public readonly category: string,
    public readonly issues: ValidationIssue[]
  ) {
    super(category, vscode.TreeItemCollapsibleState.Expanded);

    this.contextValue = 'validationCategory';

    // Count severities
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    // Set description with counts
    const parts = [];
    if (errorCount > 0) {
      parts.push(`${errorCount} errors`);
    }
    if (warningCount > 0) {
      parts.push(`${warningCount} warnings`);
    }
    if (infoCount > 0) {
      parts.push(`${infoCount} info`);
    }
    this.description = parts.join(', ');

    // Set icon based on most severe issue
    if (errorCount > 0) {
      this.iconPath = new vscode.ThemeIcon('error');
    } else if (warningCount > 0) {
      this.iconPath = new vscode.ThemeIcon('warning');
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}

class ValidationIssueItem extends vscode.TreeItem {
  constructor(public readonly issue: ValidationIssue) {
    super(issue.message, vscode.TreeItemCollapsibleState.None);

    this.contextValue = issue.fix ? 'validationIssueWithFix' : 'validationIssue';

    // Set icon based on severity
    const icons = {
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    this.iconPath = new vscode.ThemeIcon(icons[issue.severity]);

    // Add line number if available
    if (issue.line !== undefined) {
      this.description = `Line ${issue.line}`;
    }

    // Add tooltip with fix info
    if (issue.fix) {
      this.tooltip = new vscode.MarkdownString(
        `${issue.message}\n\n**Quick Fix:** ${issue.fix.label}`
      );
    }

    // Add command to jump to line if available
    if (issue.line !== undefined) {
      this.command = {
        command: 'manicMiners.goToLine',
        title: 'Go to Line',
        arguments: [issue.line],
      };
    }
  }
}
