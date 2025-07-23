/**
 * Debounce utility for performance optimization
 * Delays function execution until after a period of inactivity
 */

export interface DebounceOptions {
  leading?: boolean; // Execute on leading edge
  trailing?: boolean; // Execute on trailing edge (default: true)
  maxWait?: number; // Maximum time to wait before forcing execution
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: any;

  const { leading = false, trailing = true, maxWait } = options;

  const invokeFunc = (time: number) => {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  };

  const leadingEdge = (time: number) => {
    // Reset any `maxWait` timer
    lastInvokeTime = time;

    // Start the timer for the trailing edge
    timeout = setTimeout(timerExpired, wait);

    // Invoke the leading edge
    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit
    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    // Restart the timer
    timeout = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeout = null;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = null;
    return result;
  };

  const cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    if (maxTimeout !== null) {
      clearTimeout(maxTimeout);
      maxTimeout = null;
    }

    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = null;
  };

  const flush = () => {
    return timeout === null ? result : trailingEdge(Date.now());
  };

  const pending = () => {
    return timeout !== null;
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastCallTime);
      }

      if (maxWait !== undefined) {
        // Handle invocations in a tight loop
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }

    return result;
  };

  (debounced as any).cancel = cancel;
  (debounced as any).flush = flush;
  (debounced as any).pending = pending;

  return debounced;
}

/**
 * Throttle function that ensures func is called at most once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  return debounce(func, wait, {
    leading: options.leading !== false,
    trailing: options.trailing !== false,
    maxWait: wait,
  });
}

/**
 * Specialized debounce for resize events with requestAnimationFrame
 */
export function debounceResize(
  callback: (event: Event) => void,
  delay = 100
): (event: Event) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let rafId: number | null = null;

  return (event: Event) => {
    // Cancel any pending timeouts or animation frames
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        callback(event);
      });
    }, delay);
  };
}

/**
 * Debounce for scroll events with passive event listener support
 */
export function debounceScroll(
  callback: (event: Event) => void,
  delay = 50
): (event: Event) => void {
  const debouncedFn = debounce(callback, delay, {
    leading: true,
    trailing: true,
    maxWait: 100,
  });

  // Mark as passive for better scroll performance
  (debouncedFn as any).passive = true;

  return debouncedFn;
}

/**
 * Batch multiple function calls into a single execution
 */
export class BatchProcessor<T> {
  private items: T[] = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private processor: (items: T[]) => void,
    private delay = 16 // Default to one frame
  ) {}

  add(item: T): void {
    this.items.push(item);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.items.length === 0) {
      return;
    }

    const itemsToProcess = [...this.items];
    this.items = [];
    this.timeout = null;

    this.processor(itemsToProcess);
  }

  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.items = [];
  }
}
