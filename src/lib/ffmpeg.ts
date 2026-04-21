import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

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
 * Ensures that only one load process is ever in flight.
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
        await loadFromBase(MT_BASE_URL)
      } else {
        await loadFromBase(ST_BASE_URL)
      }

      ffmpegInstance = ffmpeg
      return ffmpeg
    } catch (error) {
      // If we tried MT and it failed (common when COOP/COEP is missing), retry ST once.
      try {
        const ffmpeg = new FFmpeg()
        await ffmpeg.load({
          coreURL: await toBlobURL(`${ST_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${ST_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
          workerURL: await toBlobURL(`${ST_BASE_URL}/ffmpeg-core.worker.js`, "text/javascript"),
        })
        ffmpegInstance = ffmpeg
        return ffmpeg
      } catch {
        // fallthrough to reset initPromise below
      }
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
  getFFmpeg().catch(() => {
    // Silently fail on pre-warm, the actual tool will handle the error
  })
}
