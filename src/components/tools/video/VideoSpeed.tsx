import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { FastForward, Download, Loader2, Play, ArrowLeft, Info } from "lucide-react"
import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { downloadBlob } from "@/lib/canvas"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function VideoSpeed() {
  const [file, setFile] = useState<File | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setResultUrl(null)
    }
  }

  const processVideo = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)

    try {
      const inputName = "input" + file.name.substring(file.name.lastIndexOf("."))
      const outputName = "output.mp4"
      
      // Video filter: setpts=1/SPEED*PTS
      // Audio filter: atempo=SPEED (limited to 0.5-2.0, so we might need multiple)
      let audioFilter = ""
      if (speed >= 0.5 && speed <= 2.0) {
        audioFilter = `atempo=${speed}`
      } else if (speed > 2.0) {
        // e.g. 4.0 -> atempo=2.0,atempo=2.0
        const parts = []
        let remaining = speed
        while (remaining > 2.0) {
          parts.push("atempo=2.0")
          remaining /= 2.0
        }
        parts.push(`atempo=${remaining}`)
        audioFilter = parts.join(",")
      } else if (speed < 0.5) {
        // e.g. 0.25 -> atempo=0.5,atempo=0.5
        const parts = []
        let remaining = speed
        while (remaining < 0.5) {
          parts.push("atempo=0.5")
          remaining *= 2.0
        }
        parts.push(`atempo=${remaining}`)
        audioFilter = parts.join(",")
      }

      const args = [
        "-i", inputName,
        "-filter_complex", `[0:v]setpts=${1/speed}*PTS[v];[0:a]${audioFilter}[a]`,
        "-map", "[v]", "-map", "[a]",
        "-preset", "ultrafast",
        outputName
      ]

      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args,
        onProgress: setProgress,
      })

      const blob = new Blob([data as any], { type: "video/mp4" })
      setResultUrl(URL.createObjectURL(blob))
      toast.success("Video speed adjusted!")
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to process video")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (resultUrl) {
      const a = document.createElement("a")
      a.href = resultUrl
      a.download = `speed-${speed}x-${file?.name}`
      a.click()
    }
  }

  return (
    <ToolLayout
      title="Video Speed Changer"
      description="Adjust video playback speed with intelligent audio pitch correction."
      icon={FastForward}
    >
      <div className="space-y-6">
        {!file ? (
          <DropZone onDrop={handleDrop} accept={{ "video/*": [] }} label="Drop video to retime" />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                     <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Ready for processing</p>
                  </div>
               </div>
               <button onClick={() => { setFile(null); setResultUrl(null); }} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
                 <ArrowLeft className="w-3 h-3" /> Change
               </button>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Playback Speed</label>
                     <span className={cn(
                       "font-mono text-xl font-black",
                       speed > 1 ? "text-primary" : speed < 1 ? "text-accent" : "text-white"
                     )}>{speed.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.25" 
                    max="4.0" 
                    step="0.05"
                    value={speed}
                    onChange={e => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                     <span>Slow (0.25x)</span>
                     <span>Normal (1.0x)</span>
                     <span>Fast (4.0x)</span>
                  </div>
               </div>

               <div className="flex gap-4">
                  {isProcessing ? (
                    <div className="w-full space-y-3">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-primary animate-pulse">Processing Video...</span>
                          <span className="font-mono">{progress}%</span>
                       </div>
                       <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                       </div>
                    </div>
                  ) : resultUrl ? (
                    <button 
                      onClick={handleDownload}
                      className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      <Download className="w-5 h-5" /> Export </button>
                  ) : (
                    <button 
                      onClick={processVideo}
                      className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                      <FastForward className="w-5 h-5" /> Apply Speed Change
                    </button>
                  )}
               </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
               <Info className="w-5 h-5 text-primary shrink-0" />
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Vanity uses the FFmpeg <code>atempo</code> and <code>setpts</code> filters to ensure audio pitch remains consistent while changing speed. All processing is 100% local and never leaves your browser.
               </p>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
