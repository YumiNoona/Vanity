import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

let ffmpegInstance: FFmpeg | null = null
let initPromise: Promise<FFmpeg> | null = null

const BASE_URL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"

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
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
        workerURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.worker.js`, "text/javascript"),
      })

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
  getFFmpeg().catch(() => {
    // Silently fail on pre-warm, the actual tool will handle the error
  })
}
