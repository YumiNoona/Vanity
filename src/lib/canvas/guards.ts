/**
 * Guards and scaling logic for heavy image processing
 */

const MAX_PIXELS = 20_000_000; // 20MP
const MAX_DIMENSION = 8192; // Max width or height for most GPUs

export interface ScaledDimensions {
  width: number;
  height: number;
  scale: number;
  isScaled: boolean;
}

export const getAdaptiveDimensions = (
  originalWidth: number,
  originalHeight: number
): ScaledDimensions => {
  let width = originalWidth;
  let height = originalHeight;
  let scale = 1;

  // 1. Clamp to MAX_DIMENSION
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }

  // 2. Iterative adjustment for MAX_PIXELS
  while (width * height > MAX_PIXELS) {
    const adjustment = 0.9;
    width = Math.floor(width * adjustment);
    height = Math.floor(height * adjustment);
    scale *= adjustment;
  }

  return {
    width,
    height,
    scale,
    isScaled: scale < 1,
  };
};

/**
 * Standardized time-budgeted task runner.
 * Yields every 16ms to maintain 60fps responsiveness.
 */
export const runYieldedTask = async (
  step: () => void,
  shouldContinue: () => boolean
) => {
  let lastYield = performance.now();

  while (shouldContinue()) {
    step();

    // Yield every 16ms of cumulative execution
    if (performance.now() - lastYield > 16) {
      await new Promise(requestAnimationFrame);
      lastYield = performance.now();
    }
  }
};

/**
 * Aggressively release GPU memory
 */
export const releaseCanvas = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
};
