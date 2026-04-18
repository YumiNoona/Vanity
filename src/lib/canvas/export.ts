/**
 * Defensive canvas-to-blob export
 */

export const exportCanvas = async (
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.95
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas export failed - null blob produced"));
            return;
          }
          resolve(blob);
        },
        type,
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
};

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
