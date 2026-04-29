import type { FFmpeg } from "@ffmpeg/ffmpeg"
import { PreloadPool } from "./preload-pool"

let ffmpegInstance: FFmpeg | null = null
let initPromise: Promise<FFmpeg> | null = null

const MT_BASE_URL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"
const ST_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"

const isCrossOriginIsolated = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof window !== "undefined" && Boolean((window as any).crossOriginIsolated)
  } catch {
    return false
  }
}

/**
 * Returns a shared FFmpeg instance.
 * Ensures that only one load process is ever in flight and libraries are loaded on demand.
 */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      // Dynamic import to keep the main bundle lean
      const { FFmpeg } = await import("@ffmpeg/ffmpeg")
      const { toBlobURL } = await import("@ffmpeg/util")

      const ffmpeg = new FFmpeg()

      const loadFromBase = async (baseUrl: string) => {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm"),
          workerURL: await toBlobURL(`${baseUrl}/ffmpeg-core.worker.js`, "text/javascript"),
        })
      }

      // Prefer multi-threaded core only when isolated (COOP/COEP)
      if (isCrossOriginIsolated()) {
        try {
          await loadFromBase(MT_BASE_URL)
        } catch (e) {
          console.warn("FFmpeg MT load failed, falling back to ST", e)
          await loadFromBase(ST_BASE_URL)
        }
      } else {
        await loadFromBase(ST_BASE_URL)
      }

      ffmpegInstance = ffmpeg
      return ffmpeg
    } catch (error) {
      initPromise = null // Reset on failure so the user can try again
      throw error
    }
  })()

  return initPromise
}

/**
 * Optional: Pre-warm the FFmpeg instance during app idle time
 */
export function prewarmFFmpeg() {
  PreloadPool.ffmpeg(() => getFFmpeg())
}

/**
 * Terminate the FFmpeg instance and free memory
 */
export function disposeFFmpeg() {
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate()
    } catch (e) {
      console.warn("FFmpeg termination error", e)
    }
    ffmpegInstance = null
    initPromise = null
  }
}
