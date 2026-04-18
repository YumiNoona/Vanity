/**
 * High-reliability image loading with EXIF orientation support
 */

export interface LoadedImage {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}

export const loadImage = async (file: File): Promise<LoadedImage> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    // 1. Primary: ImageBitmap with orientation support
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => {
        bitmap.close?.();
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    // 2. Fallback: Standand Image with decode()
    console.warn("ImageBitmap failed, falling back to img.decode", error);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = async () => {
        try {
          await img.decode();
          resolve({
            source: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            cleanup: () => URL.revokeObjectURL(objectUrl),
          });
        } catch (e) {
          reject(new Error("Image decode failed"));
        }
      };

      img.onerror = () => reject(new Error("Image load failed"));
      img.src = objectUrl;
    });
  }
};
