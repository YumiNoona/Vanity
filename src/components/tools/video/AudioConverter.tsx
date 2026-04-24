import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Music, Download, Zap, Headphones } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useProcessingState } from "@/hooks/useProcessingState"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { useObjectUrl } from "@/hooks/useObjectUrl"

const FORMATS = ["mp3", "wav", "ogg", "aac", "m4a"]

export function AudioConverter() {
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [targetFormat, setTargetFormat] = useState("mp3")

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      clearResultUrl()
    }
  }

  const convertAudio = async () => {
    if (!file) return
    startProcessing()
    const inputName = `input.${file.name.split('.').pop()}`
    const outputName = `output.${targetFormat}`

    try {
      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args: ["-i", inputName, outputName],
        onProgress: updateProgress,
      })
      const blob = new Blob([data as any], { type: `audio/${targetFormat}` })
      setResultUrl(blob)
      toast.success("Audio converted!")
    } catch (error) {
      console.error(error)
      toast.error("Conversion failed.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-audio.${targetFormat}`
    a.click()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Audio Converter" description="Convert between any audio format (MP3, WAV, M4A) locally in your browser." icon={Music}>
        <DropZone onDrop={handleDrop} accept={{ "audio/*": [] }} label="Drop audio file to convert" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Transcoding Hub" description={file.name} icon={Headphones} onBack={() => { setFile(null); clearResultUrl(); }} backLabel="Change File" maxWidth="max-w-5xl">

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
              ) : resultUrl ? (
                <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
                   <h2 className="text-4xl font-bold font-syne text-white">Audio Ready</h2>
                   <button 
                     onClick={handleDownload}
                     className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] transition-all flex items-center gap-4 mx-auto"
                   >
                     <Download className="w-6 h-6" /> Export.{targetFormat.toUpperCase()} File
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
    </ToolLayout>
  )
}
