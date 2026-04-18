import { useState, useCallback } from "react"

/**
 * Centralized processing/progress state hook.
 * Eliminates repeated isProcessing + progress state patterns.
 */
export function useProcessingState() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const startProcessing = useCallback(() => {
    setIsProcessing(true)
    setProgress(0)
  }, [])

  const updateProgress = useCallback((percent: number) => {
    setProgress(Math.min(100, Math.max(0, percent)))
  }, [])

  const finishProcessing = useCallback(() => {
    setIsProcessing(false)
    setProgress(100)
  }, [])

  const reset = useCallback(() => {
    setIsProcessing(false)
    setProgress(0)
  }, [])

  return {
    isProcessing,
    progress,
    startProcessing,
    updateProgress,
    finishProcessing,
    reset,
  }
}
