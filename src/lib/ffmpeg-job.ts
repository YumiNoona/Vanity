import { fetchFile } from "@ffmpeg/util"
import { getFFmpeg } from "@/lib/ffmpeg"

export interface RunFFmpegJobOptions {
  file: File
  inputName: string
  outputName: string
  args: string[]
  onProgress?: (progressPercent: number) => void
}

export async function runFFmpegJob({
  file,
  inputName,
  outputName,
  args,
  onProgress,
}: RunFFmpegJobOptions): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg()
  const onProgressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.round(progress * 100))
  }

  try {
    ffmpeg.on("progress", onProgressHandler)
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    await ffmpeg.exec(args)
    const data = await ffmpeg.readFile(outputName)
    return new Uint8Array((data as Uint8Array).buffer)
  } finally {
    if (typeof (ffmpeg as any).off === "function") {
      ;(ffmpeg as any).off("progress", onProgressHandler)
    }
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)])
  }
}
