import React, { useState, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Music, Download, RefreshCw, Zap, Headphones } from "lucide-react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"
import { useProcessingState } from "@/hooks/useProcessingState"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const FORMATS = ["mp3", "wav", "ogg", "aac", "m4a"]

export function AudioConverter() {
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [targetFormat, setTargetFormat] = useState("mp3")
  const ffmpegRef = useRef(new FFmpeg())

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setResultBlob(null)
    }
  }

  const loadFfmpeg = async () => {
    const ffmpeg = ffmpegRef.current
    if (ffmpeg.loaded) return
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm"
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
    })
  }

  const convertAudio = async () => {
    if (!file) return
    startProcessing()
    
    try {
      const ffmpeg = ffmpegRef.current
      await loadFfmpeg()
      
      ffmpeg.on("progress", ({ progress }) => {
        updateProgress(Math.round(progress * 100))
      })

      const inputName = `input.${file.name.split('.').pop()}`
      const outputName = `output.${targetFormat}`
      
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      await ffmpeg.exec(["-i", inputName, outputName])

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([new Uint8Array((data as Uint8Array).buffer) as any], { type: `audio/${targetFormat}` })
      setResultBlob(blob)
      toast.success("Audio converted!")
    } catch (error) {
      console.error(error)
      toast.error("Conversion failed.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-audio.${targetFormat}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-6 text-purple-500">
            <Music className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Audio Converter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert between any audio format (MP3, WAV, M4A) locally in your browser.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "audio/*": [] }} label="Drop audio file to convert" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
             <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Transcoding Hub</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
              {isProcessing ? (
                <div className="space-y-6 text-center z-10 w-full max-w-sm">
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   <p className="text-lg font-bold text-white font-syne tracking-tight">Transcoding... {progress}%</p>
                </div>
              ) : resultBlob ? (
                <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
                   <h2 className="text-4xl font-bold font-syne text-white">Audio Ready</h2>
                   <button 
                     onClick={handleDownload}
                     className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] transition-all flex items-center gap-4 mx-auto"
                   >
                     <Download className="w-6 h-6" />
                     Save .{targetFormat.toUpperCase()} File
                   </button>
                </div>
              ) : (
                <button 
                  onClick={convertAudio}
                  className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] transition-all flex items-center gap-4"
                >
                  <Zap className="w-6 h-6" />
                  Convert to {targetFormat.toUpperCase()}
                </button>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-3xl space-y-8 border-white/10">
              <div className="space-y-4">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Output Format</label>
                 <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map(fmt => (
                       <button 
                         key={fmt}
                         onClick={() => setTargetFormat(fmt)}
                         className={cn(
                           "py-3 rounded-xl text-xs font-bold border transition-all uppercase",
                           targetFormat === fmt ? "bg-purple-500 border-purple-500 text-white" : "border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground"
                         )}
                       >
                         {fmt}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
