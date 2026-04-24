/**
 * Rendering logic for high-reliability canvas drawing
 */

export interface DrawOptions {
  fillBackground?: string; // e.g., "#ffffff" for JPEGs
  clear?: boolean;
  filter?: string; // e.g., "blur(5px)"
}

export const drawToCanvas = async (
  source: ImageBitmap | HTMLImageElement,
  canvas: HTMLCanvasElement,
  options: DrawOptions = {}
) => {
  const ctx = canvas.getContext("2d", { alpha: !options.fillBackground });
  if (!ctx) throw new Error("Could not get 2D context");

  const w = source instanceof HTMLImageElement ? source.naturalWidth : (source as ImageBitmap).width;
  const h = source instanceof HTMLImageElement ? source.naturalHeight : (source as ImageBitmap).height;
  
  canvas.width = w;
  canvas.height = h;

  // Use RAF for GPU sync
  await new Promise(requestAnimationFrame);

  if (options.clear) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (options.fillBackground) {
    ctx.fillStyle = options.fillBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  if (options.filter) {
    ctx.filter = options.filter;
  }
  
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  
  // Reset filter for next usage
  if (options.filter) {
    ctx.filter = "none";
  }
  
  return ctx;
};
