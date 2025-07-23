import { EventBus, EventHandler } from '../eventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = EventBus.getInstance();
    bus.off(); // Clear all listeners
    bus.clearMetrics();
    bus.setDebugMode(false);
  });

  describe('Basic Functionality', () => {
    it('should be a singleton', () => {
      const bus1 = EventBus.getInstance();
      const bus2 = EventBus.getInstance();
      expect(bus1).toBe(bus2);
    });

    it('should emit and receive events', () => {
      const handler = jest.fn();
      bus.on('test', { callback: handler });

      bus.emit('test', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' }, 'test');
    });

    it('should handle multiple listeners for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      bus.on('test', { callback: handler1 });
      bus.on('test', { callback: handler2 });

      bus.emit('test', 'data');

      expect(handler1).toHaveBeenCalledWith('data', 'test');
      expect(handler2).toHaveBeenCalledWith('data', 'test');
    });

    it('should unsubscribe correctly', () => {
      const handler = jest.fn();
      const unsubscribe = bus.on('test', { callback: handler });

      bus.emit('test', 'data1');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      bus.emit('test', 'data2');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Once Functionality', () => {
    it('should trigger handler only once', () => {
      const handler = jest.fn();
      bus.once('test', handler);

      bus.emit('test', 'data1');
      bus.emit('test', 'data2');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('data1', 'test');
    });
  });

  describe('Pattern Matching', () => {
    it('should handle wildcard patterns', () => {
      const handler = jest.fn();
      bus.onPattern('test.*', { callback: handler });

      bus.emit('test.one', 'data1');
      bus.emit('test.two', 'data2');
      bus.emit('other.test', 'data3');

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith('data1', 'test.one');
      expect(handler).toHaveBeenCalledWith('data2', 'test.two');
    });

    it('should handle regex patterns', () => {
      const handler = jest.fn();
      bus.onPattern(/^workspace:.*/, { callback: handler });

      bus.emit('workspace:save', 'data1');
      bus.emit('workspace:load', 'data2');
      bus.emit('editor:save', 'data3');

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Priority System', () => {
    it('should execute handlers in priority order', () => {
      const order: number[] = [];

      bus.on('test', { callback: () => order.push(1), priority: 1 });
      bus.on('test', { callback: () => order.push(2), priority: 2 });
      bus.on('test', { callback: () => order.push(3), priority: 3 });

      bus.emit('test');

      expect(order).toEqual([3, 2, 1]);
    });
  });

  describe('Filters', () => {
    it('should apply filters correctly', () => {
      const handler = jest.fn();
      const filter = (data: any) => data.type === 'valid';

      bus.on('test', { callback: handler, filter });

      bus.emit('test', { type: 'valid', value: 1 });
      bus.emit('test', { type: 'invalid', value: 2 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ type: 'valid', value: 1 }, 'test');
    });
  });

  describe('Middleware', () => {
    it('should process middleware', () => {
      const middleware = jest.fn(() => true);
      bus.use(middleware);

      bus.emit('test', 'data');

      expect(middleware).toHaveBeenCalledWith({
        event: 'test',
        data: 'data',
        timestamp: expect.any(Number),
      });
    });

    it('should block events when middleware returns false', () => {
      const handler = jest.fn();
      bus.on('test', { callback: handler });

      bus.use(() => false);
      bus.emit('test', 'data');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should modify data through middleware', () => {
      const handler = jest.fn();
      bus.on('test', { callback: handler });

      bus.use(({ data }) => ({ data: { ...data, modified: true } }));
      bus.emit('test', { original: true });

      expect(handler).toHaveBeenCalledWith({ original: true, modified: true }, 'test');
    });
  });

  describe('Event History', () => {
    it('should track event history', () => {
      bus.emit('test1', 'data1');
      bus.emit('test2', 'data2');

      const history = bus.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        event: 'test1',
        data: 'data1',
        timestamp: expect.any(Number),
      });
    });

    it('should filter history by event', () => {
      bus.emit('test1', 'data1');
      bus.emit('test2', 'data2');
      bus.emit('test1', 'data3');

      const history = bus.getHistory('test1');

      expect(history).toHaveLength(2);
      expect(history.every(h => h.event === 'test1')).toBe(true);
    });

    it('should limit history size', () => {
      // Emit more events than max history size
      for (let i = 0; i < 150; i++) {
        bus.emit('test', i);
      }

      const history = bus.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Metrics', () => {
    it('should track event metrics', () => {
      const handler = jest.fn();
      bus.on('test', { callback: handler });

      bus.emit('test', 'data1');
      bus.emit('test', 'data2');

      const metrics = bus.getMetrics('test');

      expect(metrics.test).toMatchObject({
        count: 2,
        handlerCount: 1,
        errorCount: 0,
        lastEmitted: expect.any(Number),
      });
    });

    it('should track errors in metrics', () => {
      const handler: EventHandler = {
        callback: () => {
          throw new Error('Test error');
        },
      };
      bus.on('test', handler);

      bus.emit('test', 'data');

      const metrics = bus.getMetrics('test');
      expect(metrics.test.errorCount).toBe(1);
    });
  });

  describe('waitFor', () => {
    it('should wait for event', async () => {
      setTimeout(() => bus.emit('test', 'data'), 10);

      const result = await bus.waitFor('test');
      expect(result).toBe('data');
    });

    it('should timeout if event not emitted', async () => {
      await expect(bus.waitFor('test', 10)).rejects.toThrow('Timeout');
    });

    it('should apply filter when waiting', async () => {
      setTimeout(() => {
        bus.emit('test', { value: 1 });
        bus.emit('test', { value: 2 });
      }, 10);

      const result = await bus.waitFor('test', 1000, data => data.value === 2);
      expect(result).toEqual({ value: 2 });
    });
  });

  describe('Typed Event Emitter', () => {
    interface TestEvents {
      'user:login': { userId: string; timestamp: number };
      'user:logout': { userId: string };
    }

    it('should provide type-safe event emitter', () => {
      const typedEmitter = bus.createTypedEmitter<TestEvents>();
      const handler = jest.fn();

      typedEmitter.on('user:login', handler);
      typedEmitter.emit('user:login', { userId: '123', timestamp: Date.now() });

      expect(handler).toHaveBeenCalledWith({
        userId: '123',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Scoped Event Bus', () => {
    it('should create scoped event bus', () => {
      const scopedBus = bus.createScope('module');
      const handler = jest.fn();

      scopedBus.on('action', { callback: handler });
      scopedBus.emit('action', 'data');

      // Should receive event with scope prefix
      expect(handler).toHaveBeenCalledWith('data', 'module:action');
    });

    it('should remove all scoped events', () => {
      const scopedBus = bus.createScope('module');
      const handler = jest.fn();

      scopedBus.on('action1', { callback: handler });
      scopedBus.on('action2', { callback: handler });

      scopedBus.off();

      bus.emit('module:action1', 'data');
      bus.emit('module:action2', 'data');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Queue Mode', () => {
    it('should queue events when specified', async () => {
      const handler = jest.fn();
      bus.on('test', { callback: handler });

      // Emit multiple events in queue mode
      for (let i = 0; i < 5; i++) {
        bus.emit('test', i, { queue: true });
      }

      // Handler should not be called immediately
      expect(handler).not.toHaveBeenCalled();

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling', () => {
    it('should continue processing after handler error', () => {
      const handler1: EventHandler = {
        callback: () => {
          throw new Error('Error in handler 1');
        },
      };
      const handler2 = jest.fn();

      bus.on('test', handler1);
      bus.on('test', { callback: handler2 });

      bus.emit('test', 'data');

      expect(handler2).toHaveBeenCalledWith('data', 'test');
    });
  });

  describe('Context Binding', () => {
    it('should bind context correctly', () => {
      const context = { value: 42 };
      const handler = jest.fn(function (this: typeof context) {
        return this.value;
      });

      bus.on('test', { callback: handler, context });
      bus.emit('test');

      expect(handler).toHaveBeenCalled();
    });
  });
});
