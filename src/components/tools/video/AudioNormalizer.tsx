import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Music, Download, Loader2, Play, Info, Volume2, ArrowLeft } from "lucide-react"
import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/hooks/useObjectUrl"

const LUFS_PRESETS = [
  { label: "Spotify / YouTube", value: -14, description: "Standard for most streaming platforms." },
  { label: "Podcasts", value: -16, description: "Optimized for voice clarity and consistency." },
  { label: "Television (EBU R128)", value: -23, description: "European broadcast standard." },
  { label: "US TV (ATSC A/85)", value: -24, description: "American broadcast standard." },
]

export function AudioNormalizer() {
  const [file, setFile] = useState<File | null>(null)
  const [targetLufs, setTargetLufs] = useState(-14)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      clearResultUrl()
    }
  }

  const processAudio = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)

    try {
      const inputName = "input" + file.name.substring(file.name.lastIndexOf("."))
      const outputName = "output.mp3"
      
      // single-pass loudnorm
      const args = [
        "-i", inputName,
        "-af", `loudnorm=I=${targetLufs}:LRA=7:tp=-2`,
        outputName
      ]

      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args,
        onProgress: setProgress,
      })

      const blob = new Blob([data as any], { type: "audio/mp3" })
      setResultUrl(blob)
      toast.success("Audio normalized!")
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to normalize audio")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (resultUrl) {
      const a = document.createElement("a")
      a.href = resultUrl
      a.download = `normalized-${targetLufs}LUFS-${file?.name}`
      a.click()
    }
  }

  return (
    <ToolLayout
      title="Audio Normalizer"
      description="Loudness-normalize audio files to target LUFS standards using the industry-standard loudnorm filter."
      icon={Music}
      centered={true}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {!file ? (
          <DropZone onDrop={handleDrop} accept={{ "audio/*": [], "video/*": [] }} label="Drop audio or video to normalize" />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                     <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Awaiting Normalization</p>
                  </div>
               </div>
               <button onClick={() => { setFile(null); setResultUrl(null); }} className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
                 <ArrowLeft className="w-3 h-3" /> Change
               </button>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Loudness (LUFS)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {LUFS_PRESETS.map(preset => (
                       <button
                         key={preset.value}
                         onClick={() => setTargetLufs(preset.value)}
                         className={cn(
                           "p-4 rounded-xl border text-left transition-all",
                           targetLufs === preset.value 
                             ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20" 
                             : "bg-white/5 border-white/5 hover:bg-white/10"
                         )}
                       >
                          <p className="text-xs font-bold mb-1">{preset.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{preset.description}</p>
                          <p className="mt-2 text-[10px] font-mono text-primary">{preset.value} LUFS</p>
                       </button>
                     ))}
                  </div>
                  <div className="pt-4 space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground">Custom: {targetLufs} LUFS</span>
                     </div>
                     <input 
                        type="range" min="-30" max="-5" step="1" 
                        value={targetLufs} 
                        onChange={e => setTargetLufs(parseInt(e.target.value))}
                        className="w-full accent-primary"
                     />
                  </div>
               </div>

               <div className="flex gap-4">
                  {isProcessing ? (
                    <div className="w-full space-y-3">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-primary animate-pulse">Normalizing Audio...</span>
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
                      onClick={processAudio}
                      className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                      <Volume2 className="w-5 h-5" /> Start Normalization
                    </button>
                  )}
               </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
               <Info className="w-5 h-5 text-primary shrink-0" />
               <p className="text-sm text-muted-foreground leading-relaxed">
                 Vanity uses the FFmpeg <code>loudnorm</code> filter which is a sophisticated dual-pass capable algorithm (operating here in integrated single-pass mode) to achieve target loudness without clipping.
               </p>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
