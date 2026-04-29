/**
 * Preload Arbitration Layer
 * Prevents bandwidth spikes and memory pressure by gating heavy preloads.
 */

interface PreloadState {
  ffmpeg: boolean
  pdf: boolean
  ai: boolean
}

const state: PreloadState = {
  ffmpeg: false,
  pdf: false,
  ai: false,
}

/**
 * Checks if the device is suitable for background preloading
 */
function shouldPreload(): boolean {
  // Gate by connection quality
  const conn = (navigator as any).connection
  if (conn) {
    if (conn.saveData) return false
    const type = conn.effectiveType
    if (type === 'slow-2g' || type === '2g' || type === '3g') return false
  }

  // Gate by device memory (if available)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) return false // Don't preload on devices with < 4GB RAM

  return true
}

export const PreloadPool = {
  ffmpeg: (loader: () => Promise<any>) => {
    if (state.ffmpeg || !shouldPreload()) return
    state.ffmpeg = true

    loader()
  },
  
  pdf: (loader: () => Promise<any>) => {
    if (state.pdf || !shouldPreload()) return
    state.pdf = true

    loader()
  },

  ai: (loader: () => Promise<any>) => {
    if (state.ai || !shouldPreload()) return
    state.ai = true

    loader()
  }
}
