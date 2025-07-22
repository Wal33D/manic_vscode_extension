// Browser API declarations for TypeScript
declare global {
  function requestAnimationFrame(callback: (time: number) => void): number;
  function cancelAnimationFrame(handle: number): void;
}

export interface AnimationFrame {
  tileId: number;
  duration: number; // Duration in milliseconds
}

export interface TileAnimation {
  id: string;
  name: string;
  frames: AnimationFrame[];
  loop: boolean;
}

// Define which tiles have animations and their animation sequences
export const ANIMATED_TILES: Map<number, TileAnimation> = new Map([
  // Lava animations (tiles 6-10 are all lava variations)
  [
    6,
    {
      id: 'lava_flow',
      name: 'Lava Flow',
      frames: [
        { tileId: 6, duration: 500 },
        { tileId: 7, duration: 500 },
        { tileId: 8, duration: 500 },
        { tileId: 9, duration: 500 },
        { tileId: 10, duration: 500 },
      ],
      loop: true,
    },
  ],

  // Water animations (tiles 11-16 are water variations)
  [
    11,
    {
      id: 'water_flow',
      name: 'Water Flow',
      frames: [
        { tileId: 11, duration: 600 },
        { tileId: 12, duration: 600 },
        { tileId: 13, duration: 600 },
        { tileId: 14, duration: 600 },
        { tileId: 15, duration: 600 },
        { tileId: 16, duration: 600 },
      ],
      loop: true,
    },
  ],

  // Crystal glow animation (tiles 42-45 are crystal variations)
  [
    42,
    {
      id: 'crystal_glow',
      name: 'Crystal Glow',
      frames: [
        { tileId: 42, duration: 1000 },
        { tileId: 43, duration: 1000 },
        { tileId: 44, duration: 1000 },
        { tileId: 45, duration: 1000 },
      ],
      loop: true,
    },
  ],

  // Recharge seam pulse
  [
    50,
    {
      id: 'recharge_pulse',
      name: 'Recharge Pulse',
      frames: [
        { tileId: 50, duration: 800 },
        { tileId: 51, duration: 400 },
        { tileId: 52, duration: 400 },
        { tileId: 51, duration: 400 },
      ],
      loop: true,
    },
  ],
]);

export class TileAnimationManager {
  private animations: Map<number, AnimationState> = new Map();
  private animationFrame: number | null = null;
  private lastUpdate: number = 0;
  private onUpdate: () => void;

  constructor(onUpdate: () => void) {
    this.onUpdate = onUpdate;
  }

  /**
   * Start animations for the given tiles
   */
  public startAnimations(tiles: number[][]): void {
    this.stopAnimations();

    // Find all animated tiles in the map
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const tileId = tiles[row][col];

        // Check if this tile is part of any animation (base or sequence member)
        const baseAnimation = this.findBaseAnimation(tileId);
        if (baseAnimation) {
          if (!this.animations.has(baseAnimation.baseId)) {
            this.animations.set(baseAnimation.baseId, {
              animation: baseAnimation.animation,
              currentFrame: baseAnimation.currentFrame,
              elapsedTime: 0,
            });
          }
        }
      }
    }

    // Start the animation loop if we have animations
    if (this.animations.size > 0) {
      this.lastUpdate = performance.now();
      this.animate();
    }
  }

  /**
   * Stop all animations
   */
  public stopAnimations(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.animations.clear();
  }

  /**
   * Get the current frame for a tile
   */
  public getCurrentTileId(originalTileId: number): number {
    // Find which animation this tile belongs to
    const baseAnimation = this.findBaseAnimation(originalTileId);
    if (!baseAnimation) {
      return originalTileId;
    }

    const state = this.animations.get(baseAnimation.baseId);
    if (!state) {
      return originalTileId;
    }

    return state.animation.frames[state.currentFrame].tileId;
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    let needsUpdate = false;

    // Update all animations
    for (const [, state] of this.animations) {
      state.elapsedTime += deltaTime;

      const currentFrameDuration = state.animation.frames[state.currentFrame].duration;

      if (state.elapsedTime >= currentFrameDuration) {
        // Move to next frame
        state.elapsedTime -= currentFrameDuration;
        state.currentFrame++;

        if (state.currentFrame >= state.animation.frames.length) {
          if (state.animation.loop) {
            state.currentFrame = 0;
          } else {
            state.currentFrame = state.animation.frames.length - 1;
          }
        }

        needsUpdate = true;
      }
    }

    // Notify about updates
    if (needsUpdate) {
      this.onUpdate();
    }

    // Continue animation loop
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  /**
   * Find the base animation for a tile ID
   */
  private findBaseAnimation(
    tileId: number
  ): { baseId: number; animation: TileAnimation; currentFrame: number } | null {
    // Check if this tile is directly animated
    const directAnimation = ANIMATED_TILES.get(tileId);
    if (directAnimation) {
      return { baseId: tileId, animation: directAnimation, currentFrame: 0 };
    }

    // Check if this tile is part of an animation sequence
    for (const [baseId, animation] of ANIMATED_TILES) {
      const frameIndex = animation.frames.findIndex(f => f.tileId === tileId);
      if (frameIndex !== -1) {
        return { baseId, animation, currentFrame: frameIndex };
      }
    }

    return null;
  }

  /**
   * Check if animations are running
   */
  public isAnimating(): boolean {
    return this.animationFrame !== null;
  }
}

interface AnimationState {
  animation: TileAnimation;
  currentFrame: number;
  elapsedTime: number;
}

// Export tile types that support animation
export const ANIMATABLE_TILES = Array.from(ANIMATED_TILES.keys());
