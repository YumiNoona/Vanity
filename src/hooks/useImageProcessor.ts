import { useState, useCallback, useRef, useEffect } from "react";
import { loadImage, type LoadedImage } from "../lib/canvas/loadImage";
import { guardDimensions, maybeYield } from "../lib/utils";

export interface ImageProcessResult {
  source: ImageBitmap | HTMLImageElement;
  dimensions: { width: number; height: number; scale: number };
  cleanup: () => void;
}

export const useImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeCleanupRef = useRef<(() => void) | null>(null);
  const jobIdRef = useRef(0);
  const lastUpdateRef = useRef(0);

  const clearCurrent = useCallback(() => {
    if (activeCleanupRef.current) {
      activeCleanupRef.current();
      activeCleanupRef.current = null;
    }
  }, []);

  const updateProgress = useCallback((percent: number) => {
    const now = performance.now();
    if (now - lastUpdateRef.current > 100 || percent === 100 || percent === 0) {
      setProgress(percent);
      lastUpdateRef.current = now;
    }
  }, []);

  const processImage = useCallback(async (file: File): Promise<ImageProcessResult | null> => {
    const jobId = ++jobIdRef.current;
    
    setIsProcessing(true);
    updateProgress(0);
    clearCurrent();

    try {
      const loaded = await loadImage(file);
      await maybeYield();
      
      // Zero-dimension guard
      if (loaded.width === 0 || loaded.height === 0) {
        throw new Error("Invalid image dimensions");
      }

      // Ignore stale result
      if (jobId !== jobIdRef.current) {
        loaded.cleanup();
        return null;
      }

      const dimensions = guardDimensions(loaded.width, loaded.height);

      const cleanup = () => {
        loaded.cleanup();
      };

      activeCleanupRef.current = cleanup;
      setIsProcessing(false);
      updateProgress(100);

      return {
        source: loaded.source,
        dimensions,
        cleanup,
      };
    } catch (error) {
      console.error("Image processing error:", error);
      if (jobId === jobIdRef.current) {
        setIsProcessing(false);
        updateProgress(0);
      }
      return null;
    }
  }, [clearCurrent, updateProgress]);

  // Expose current jobId for tools to check against
  const getJobId = useCallback(() => jobIdRef.current, []);

  useEffect(() => {
    return () => clearCurrent();
  }, [clearCurrent]);

  return {
    isProcessing,
    progress,
    processImage,
    clearCurrent,
    updateProgress,
    getJobId,
  };
};
