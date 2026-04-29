import { useState, useCallback, useRef, useEffect } from "react";
import { loadImage } from "../lib/canvas/loadImage";
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
  const unmountedRef = useRef(false);

  const clearCurrent = useCallback(() => {
    jobIdRef.current++;
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
    // Cancel any previous job's cleanup WITHOUT incrementing jobIdRef again.
    // clearCurrent() also does jobIdRef.current++ which would immediately stale
    // the jobId we just captured on the next line — so we inline just the cleanup part.
    if (activeCleanupRef.current) {
      activeCleanupRef.current();
      activeCleanupRef.current = null;
    }

    const jobId = ++jobIdRef.current;

    setIsProcessing(true);
    updateProgress(0);

    try {
      console.log(`[useImageProcessor] Starting job ${jobId} for file ${file.name}`);
      const loaded = await loadImage(file);
      await maybeYield();
      
      // Zero-dimension guard
      if (loaded.width === 0 || loaded.height === 0) {
        throw new Error("Invalid image dimensions");
      }

      // Ignore stale result or if component unmounted
      if (jobId !== jobIdRef.current || unmountedRef.current) {
        console.warn(`[useImageProcessor] Job ${jobId} became stale (Current: ${jobIdRef.current}, Unmounted: ${unmountedRef.current})`);
        loaded.cleanup();
        setIsProcessing(false);
        return null;
      }

      console.log(`[useImageProcessor] Job ${jobId} loaded successfully (${loaded.width}x${loaded.height})`);
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
      console.error(`[useImageProcessor] Job ${jobId} failed:`, error);
      if (jobId === jobIdRef.current) {
        setIsProcessing(false);
        updateProgress(0);
      }
      return null;
    }
  }, [updateProgress]);

  // Expose current jobId for tools to check against
  const getJobId = useCallback(() => jobIdRef.current, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearCurrent();
    };
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
