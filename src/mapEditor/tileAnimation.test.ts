import { TileAnimationManager, ANIMATED_TILES, ANIMATABLE_TILES } from './tileAnimation';

describe('TileAnimationManager', () => {
  let animationManager: TileAnimationManager;
  let updateCallback: jest.Mock;

  beforeEach(() => {
    updateCallback = jest.fn();
    animationManager = new TileAnimationManager(updateCallback);

    // Mock performance.now and requestAnimationFrame
    (global as any).performance = {
      now: jest.fn().mockReturnValue(1000),
    };

    (global as any).requestAnimationFrame = jest.fn((callback: any) => {
      setTimeout(callback, 16); // Simulate ~60fps
      return 1;
    });

    (global as any).cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    animationManager.stopAnimations();
  });

  describe('Animation definitions', () => {
    it('should have animated tiles defined', () => {
      expect(ANIMATED_TILES.size).toBeGreaterThan(0);

      // Check lava animation
      const lavaAnimation = ANIMATED_TILES.get(6);
      expect(lavaAnimation).toBeDefined();
      expect(lavaAnimation?.id).toBe('lava_flow');
      expect(lavaAnimation?.frames.length).toBe(5);
      expect(lavaAnimation?.loop).toBe(true);

      // Check water animation
      const waterAnimation = ANIMATED_TILES.get(11);
      expect(waterAnimation).toBeDefined();
      expect(waterAnimation?.id).toBe('water_flow');
      expect(waterAnimation?.frames.length).toBe(6);

      // Check crystal animation
      const crystalAnimation = ANIMATED_TILES.get(42);
      expect(crystalAnimation).toBeDefined();
      expect(crystalAnimation?.id).toBe('crystal_glow');
      expect(crystalAnimation?.frames.length).toBe(4);

      // Check recharge seam animation
      const rechargeAnimation = ANIMATED_TILES.get(50);
      expect(rechargeAnimation).toBeDefined();
      expect(rechargeAnimation?.id).toBe('recharge_pulse');
      expect(rechargeAnimation?.frames.length).toBe(4);
    });

    it('should export list of animatable tiles', () => {
      expect(ANIMATABLE_TILES).toEqual(expect.arrayContaining([6, 11, 42, 50]));
    });
  });

  describe('startAnimations', () => {
    it('should start animations for animated tiles in the map', () => {
      const tiles = [
        [1, 6, 1], // Lava tile in middle
        [11, 1, 42], // Water and crystal
        [1, 50, 1], // Recharge seam
      ];

      animationManager.startAnimations(tiles);

      expect(animationManager.isAnimating()).toBe(true);
      expect((global as any).requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not start animations if no animated tiles present', () => {
      const tiles = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];

      animationManager.startAnimations(tiles);

      expect(animationManager.isAnimating()).toBe(false);
      expect((global as any).requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('should handle tiles that are part of animation sequences', () => {
      const tiles = [
        [7, 8, 9], // Different lava frames (part of lava animation)
        [12, 13, 14], // Different water frames (part of water animation)
      ];

      animationManager.startAnimations(tiles);

      // These tiles are part of animation sequences, so animations should start
      expect(animationManager.isAnimating()).toBe(true);

      // Should recognize these as part of the lava (6) and water (11) animations
      const lavaTileId = animationManager.getCurrentTileId(7);
      expect([6, 7, 8, 9, 10]).toContain(lavaTileId);

      const waterTileId = animationManager.getCurrentTileId(12);
      expect([11, 12, 13, 14, 15, 16]).toContain(waterTileId);
    });
  });

  describe('getCurrentTileId', () => {
    it('should return original tile ID for non-animated tiles', () => {
      expect(animationManager.getCurrentTileId(1)).toBe(1); // Ground tile
      expect(animationManager.getCurrentTileId(40)).toBe(40); // Wall tile
    });

    it('should return current frame for animated tiles', () => {
      const tiles = [[6]]; // Lava tile
      animationManager.startAnimations(tiles);

      // Initially should return first frame
      expect(animationManager.getCurrentTileId(6)).toBe(6);

      // After animation update, should return different frame
      (performance.now as jest.Mock).mockReturnValue(1600); // 600ms later

      // Trigger animation frame
      const animateCallback = ((global as any).requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback();

      // Should have moved to next frame
      expect(animationManager.getCurrentTileId(6)).toBe(7);
    });

    it('should handle tiles that are part of sequences', () => {
      const tiles = [[8]]; // Middle of lava sequence
      animationManager.startAnimations(tiles);

      // Should map back to base animation
      expect([6, 7, 8, 9, 10]).toContain(animationManager.getCurrentTileId(8));
    });
  });

  describe('stopAnimations', () => {
    it('should stop all animations', () => {
      const tiles = [[6, 11]];
      animationManager.startAnimations(tiles);

      expect(animationManager.isAnimating()).toBe(true);

      animationManager.stopAnimations();

      expect(animationManager.isAnimating()).toBe(false);
      expect((global as any).cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Animation updates', () => {
    it('should call update callback when frames change', done => {
      const tiles = [[6]]; // Lava tile
      animationManager.startAnimations(tiles);

      // Mock time progression
      (performance.now as jest.Mock).mockReturnValue(1600); // 600ms later

      // Trigger animation frame
      const animateCallback = ((global as any).requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback();

      // Should have called update callback
      expect(updateCallback).toHaveBeenCalled();
      done();
    });

    it('should loop animations', () => {
      const tiles = [[6]]; // Lava tile with 5 frames
      animationManager.startAnimations(tiles);

      // Progress through all frames
      for (let i = 0; i < 6; i++) {
        (performance.now as jest.Mock).mockReturnValue(1000 + i * 600);
        const animateCallback = ((global as any).requestAnimationFrame as jest.Mock).mock.calls[
          i
        ][0];
        animateCallback();
      }

      // Should loop back to first frame
      expect(animationManager.getCurrentTileId(6)).toBe(6);
    });
  });
});
