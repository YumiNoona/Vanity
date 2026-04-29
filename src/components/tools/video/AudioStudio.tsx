import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Music, Download, Zap, Headphones, Mic, RefreshCw, Activity } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { useProcessingState } from "@/hooks/useProcessingState"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { useObjectUrl } from "@/hooks/useObjectUrl"

type AudioMode = "convert" | "normalize" | "extract"

const FORMATS = ["mp3", "wav", "ogg", "aac", "m4a"]

const LUFS_PRESETS = [
  { label: "Streaming", value: -14, description: "Spotify, YouTube, etc." },
  { label: "Podcast", value: -16, description: "Voice clarity optimization." },
  { label: "EU TV", value: -23, description: "EBU R128 standard." },
  { label: "US TV", value: -24, description: "ATSC A/85 standard." },
]

export function AudioStudio() {
  const [mode, setMode] = useState<AudioMode>("convert")
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  
  // Convert settings
  const [targetFormat, setTargetFormat] = useState("mp3")
  
  // Normalize settings
  const [targetLufs, setTargetLufs] = useState(-14)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      clearResultUrl()
    }
  }

  const process = async () => {
    if (!file) return
    startProcessing()

    try {
      const inputExt = file.name.split('.').pop()
      const inputName = `input.${inputExt}`
      let outputName = "output.mp3"
      let args: string[] = []

      if (mode === "convert") {
        outputName = `output.${targetFormat}`
        args = ["-i", inputName, outputName]
      } else if (mode === "normalize") {
        outputName = "output.mp3"
        args = ["-i", inputName, "-af", `loudnorm=I=${targetLufs}:LRA=7:tp=-2`, outputName]
      } else if (mode === "extract") {
        outputName = "output.mp3"
        args = ["-i", inputName, "-vn", "-ab", "192k", "-ar", "44100", "-y", outputName]
      }

      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args,
        onProgress: updateProgress,
      })

      const blob = new Blob([data as any], { type: `audio/${outputName.split('.').pop()}` })
      setResultUrl(blob)
      toast.success(`${mode === 'extract' ? 'Audio extracted' : mode === 'normalize' ? 'Audio normalized' : 'Audio converted'}!`)
    } catch (error) {
      console.error(error)
      toast.error("Processing failed.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    const ext = mode === "convert" ? targetFormat : "mp3"
    a.download = `vanity-audio-${Date.now()}.${ext}`
    a.click()
  }

  if (!file) {
    return (
      <ToolUploadLayout 
        title="Audio Studio" 
        description="Professional local audio processing: Convert formats, normalize loudness, or extract audio from video." 
        icon={Music}
      >
        <DropZone 
          onDrop={handleDrop} 
          accept={mode === "extract" ? { "video/*": [] } : { "audio/*": [], "video/*": [] }} 
          label={mode === "extract" ? "Drop video to extract audio" : "Drop audio or video file"} 
        />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Audio Studio"
      description="All-in-one local audio workbench."
      icon={Music}
      centered={true}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-center">
          <PillToggle
            activeId={mode}
            onChange={(id) => {
              setMode(id as AudioMode)
              clearResultUrl()
            }}
            options={[
              { id: "convert", label: "Convert", icon: RefreshCw },
              { id: "normalize", label: "Normalize", icon: Activity },
              { id: "extract", label: "Extract", icon: Mic },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors">Change</button>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {mode === "convert" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Format</label>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map(f => (
                      <button
                        key={f}
                        onClick={() => setTargetFormat(f)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          targetFormat === f ? "bg-primary border-primary text-primary-foreground" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "normalize" && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Loudness (LUFS)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LUFS_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setTargetLufs(p.value)}
                        className={cn(
                          "p-3 rounded-xl text-left transition-all border group",
                          targetLufs === p.value ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase">{p.label}</p>
                        <p className="text-[9px] opacity-60 leading-tight mt-1">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "extract" && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3">
                  <Mic className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Will extract high-quality 192kbps MP3 audio from the video track using local processing.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={process}
              disabled={isProcessing}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-4 h-4 animate-pulse" />
                  Processing {Math.round(progress * 100)}%
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Processing
                </>
              )}
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[300px]">
            {resultUrl ? (
              <div className="w-full space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
                  <Headphones className="w-10 h-10" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold text-white">Result Ready</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Process Complete</p>
                </div>
                <audio controls src={resultUrl} className="w-full opacity-80" />
                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Result
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 opacity-20">
                <Music className="w-16 h-16 mx-auto" />
                <p className="text-sm font-medium">Output will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
