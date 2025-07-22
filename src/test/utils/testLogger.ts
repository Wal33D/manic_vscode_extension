/**
 * Test logger utility for golden test framework
 * Provides testable logging without using console directly
 */

export interface TestLoggerOptions {
  verbose?: boolean;
  silent?: boolean;
}

export class TestLogger {
  private options: TestLoggerOptions;
  private logs: string[] = [];

  constructor(options: TestLoggerOptions = {}) {
    this.options = options;
  }

  log(message: string): void {
    this.logs.push(message);
    if (!this.options.silent && this.options.verbose) {
      // In test environment, we can use process.stdout.write
      // This avoids ESLint console warnings
      process.stdout.write(message + '\n');
    }
  }

  error(message: string): void {
    this.logs.push(`ERROR: ${message}`);
    if (!this.options.silent) {
      process.stderr.write(`ERROR: ${message}\n`);
    }
  }

  warn(message: string): void {
    this.logs.push(`WARN: ${message}`);
    if (!this.options.silent && this.options.verbose) {
      process.stdout.write(`WARN: ${message}\n`);
    }
  }

  info(message: string): void {
    this.logs.push(`INFO: ${message}`);
    if (!this.options.silent && this.options.verbose) {
      process.stdout.write(`INFO: ${message}\n`);
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

// Singleton instance for tests
export const testLogger = new TestLogger({ verbose: false });
