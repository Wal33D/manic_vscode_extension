/**
 * Test environment setup
 */

// Set up global test environment
process.env.NODE_ENV = 'test';

// Mock VS Code module globally
jest.mock('vscode');

// Set up global matchers
import '@testing-library/jest-dom';

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toContainObject(received: any[], expected: any) {
    const pass = received.some((item: any) =>
      Object.keys(expected).every(key => item[key] === expected[key])
    );

    if (pass) {
      return {
        message: () => `expected array not to contain object matching ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected array to contain object matching ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  },

  toHaveBeenCalledWithMatch(received: jest.Mock, expected: any) {
    const calls = received.mock.calls;
    const pass = calls.some((args: any[]) =>
      args.some((arg: any) =>
        typeof expected === 'object'
          ? Object.keys(expected).every(key => arg[key] === expected[key])
          : arg === expected
      )
    );

    if (pass) {
      return {
        message: () =>
          `expected mock not to have been called with matching ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected mock to have been called with matching ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  },
});

// Declare custom matcher types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toContainObject(expected: any): R;
      toHaveBeenCalledWithMatch(expected: any): R;
    }
  }
}

// Set up console mocking
const originalConsole = { ...console };
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Set up performance mocking
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  } as any;
}

// Set up request animation frame mocking
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = ((callback: (time: number) => void) => {
    return setTimeout(() => callback(Date.now()), 16); // ~60fps
  }) as any;

  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Set test timeout
jest.setTimeout(10000); // 10 seconds

// Export test utilities
export * from './utils/testHelpers';
export * from './utils/testDataFactory';
