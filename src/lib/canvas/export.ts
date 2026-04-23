/**
 * Defensive canvas-to-blob export with timeout protection.
 * Some browsers silently ignore unsupported MIME types (e.g., image/avif in Firefox)
 * and never fire the toBlob callback at all, hanging the Promise forever.
 */

const EXPORT_TIMEOUT_MS = 30_000;

export const exportCanvas = async (
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.95
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Canvas export timed out after ${EXPORT_TIMEOUT_MS / 1000}s — your browser likely doesn't support "${type}". Try PNG or JPEG instead.`
        )
      );
    }, EXPORT_TIMEOUT_MS);

    try {
      canvas.toBlob(
        (blob) => {
          clearTimeout(timer);
          if (!blob) {
            reject(new Error(`Canvas export failed — null blob for "${type}". This format may not be supported in your browser.`));
            return;
          }
          resolve(blob);
        },
        type,
        quality
      );
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
};

/**
 * Detect browser support for a given canvas export MIME type.
 * Creates a tiny 1x1 canvas, attempts toDataURL, and checks
 * if the browser actually produced that format vs falling back to PNG.
 */
export function canvasSupportsMime(mimeType: string): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const dataUrl = c.toDataURL(mimeType);
    // Browsers fall back to image/png for unsupported types
    return dataUrl.startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give it a moment before revoking
  setTimeout(() => URL.revokeObjectURL(url), 100);
};
