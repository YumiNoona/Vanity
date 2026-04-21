import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Video, Download, ShieldCheck, Zap } from "lucide-react"
import { useProcessingState } from "@/hooks/useProcessingState"
import { toast } from "sonner"

import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function VideoCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [crf, setCrf] = useState(28) // Compression level
  const [resultSize, setResultSize] = useState(0)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      clearResultUrl()
    }
  }

  const compressVideo = async () => {
    if (!file) return
    startProcessing()
    const inputName = "input.mp4"
    const outputName = "output.mp4"

    try {
      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args: [
          "-i",
          inputName,
          "-vcodec",
          "libx264",
          "-crf",
          crf.toString(),
          "-preset",
          "ultrafast",
          "-acodec",
          "aac",
          outputName,
        ],
        onProgress: updateProgress,
      })
      const blob = new Blob([data as any], { type: "video/mp4" })
      setResultSize(blob.size)
      setResultUrl(blob)
      toast.success("Video compressed successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Compression failed. Ensure COOP/COEP headers are set.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-compressed-${file?.name}`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-6 text-purple-500">
            <Video className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Video Compressor</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Shrink MP4, WebM, or MOV files locally using high-performance <strong>FFMPEG.wasm</strong>.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "video/*": [] }} label="Drop video to compress" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
             <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Encoding Engine</h1>
            <p className="text-muted-foreground text-sm">{file.name} ({Math.round(file.size / 1024 / 1024)} MB)</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearResultUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change Video
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
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Compacting Video...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{progress}% - FFMPEG Multi-threaded</p>
                   </div>
                </div>
              ) : resultUrl ? (
                <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="p-6 bg-emerald-500/10 rounded-full inline-block text-emerald-500 border border-emerald-500/20">
                      <ShieldCheck className="w-12 h-12" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-4xl font-bold font-syne text-white">Encoding Complete</h2>
                      <p className="text-muted-foreground">
                        Size reduced to <strong>{(resultSize / 1024 / 1024).toFixed(2)} MB</strong>.
                      </p>
                   </div>
                   <button 
                     onClick={handleDownload}
                     className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] transition-all flex items-center gap-4 mx-auto"
                   >
                     <Download className="w-6 h-6" />
                     Save Compressed MP4
                   </button>
                </div>
              ) : (
                <div className="text-center space-y-8">
                   <div className="w-32 h-32 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500">
                      <Video className="w-12 h-12" />
                   </div>
                   <button 
                     onClick={compressVideo}
                     className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] transition-all flex items-center gap-4"
                   >
                     <Zap className="w-6 h-6" />
                     Start Local Compression
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-3xl space-y-8 border-white/10">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compression Level</label>
                    <span className="text-sm font-bold font-mono text-purple-500">CRF {crf}</span>
                 </div>
                 <input 
                   type="range" 
                   min="18" 
                   max="40" 
                   value={crf}
                   onChange={(e) => setCrf(parseInt(e.target.value))}
                   className="w-full h-1.5 bg-purple-500/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                 />
                 <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    <span>High Quality</span>
                    <span>Max Shrink</span>
                 </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                 <h5 className="text-[10px] font-bold text-white uppercase tracking-widest">Platform Status</h5>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   <strong>SharedArrayBuffer</strong> {window.crossOriginIsolated ? '✅ Enabled' : '❌ Disabled'}. Multi-threading is {window.crossOriginIsolated ? 'active' : 'inactive'}.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
