import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Film, Zap } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useProcessingState } from "@/hooks/useProcessingState"
import { toast } from "sonner"
import { toBlob } from "@/lib/utils/blob"

import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function VideoToGif() {
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [fps, setFps] = useState(10)
  const [scale, setScale] = useState(480)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      clearResultUrl()
    }
  }
  const convertToGif = async () => {
    if (!file) return
    startProcessing()
    const inputName = "input.mp4"
    const outputName = "output.gif"

    try {
      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args: [
          "-i",
          inputName,
          "-vf",
          `fps=${fps},scale=${scale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
          outputName,
        ],
        onProgress: updateProgress,
      })
      const blob = toBlob(data, "image/gif")
      setResultUrl(blob)
      toast.success("GIF generated successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Conversion failed. Ensure COOP/COEP headers are set.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-capture-${Date.now()}.gif`
    a.click()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Video to GIF" description="Convert MP4 or WebM clips into shared-friendly GIFs. 100% private, 100% local." icon={Film}>
        <DropZone onDrop={handleDrop} accept={{ "video/*": [] }} label="Drop video to convert" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="GIF Transcoder" 
      description={file.name} 
      icon={Film} 
      maxWidth="max-w-5xl"
      centered={true}
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden text-center">
              {isProcessing ? (
                <div className="space-y-6 z-10 w-full max-w-sm">
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Transcoding frames...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{progress}% - CPU Worker</p>
                   </div>
                </div>
              ) : resultUrl ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                   <div className="relative inline-block group">
                      <img 
                        src={resultUrl} 
                        className="max-w-xs rounded-xl border border-white/10 shadow-2xl" 
                        alt="Result Preview" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                         <span className="text-[10px] font-bold text-white uppercase tracking-widest">Preview Only</span>
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <button 
                       onClick={handleDownload}
                       className="px-12 py-5 bg-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.05] transition-all flex items-center gap-4"
                     >
                       <Download className="w-6 h-6" /> Export 
                     </button>
                     <button 
                       onClick={() => { setFile(null); clearResultUrl(); }}
                       className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center"
                     >
                       Start New
                     </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="w-32 h-32 mx-auto bg-pink-500/20 rounded-full flex items-center justify-center text-pink-500">
                      <Film className="w-12 h-12" />
                   </div>
                   <button 
                     onClick={convertToGif}
                     className="px-12 py-5 bg-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-[1.05] transition-all flex items-center gap-4"
                   >
                     <Zap className="w-6 h-6" />
                     Generate GIF
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-3xl space-y-8 border-white/10">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Frame Rate</label>
                       <span className="text-sm font-bold font-mono text-pink-500">{fps} FPS</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="24" 
                      value={fps}
                      onChange={(e) => setFps(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-pink-500"
                    />
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Width Scale</label>
                       <span className="text-sm font-bold font-mono text-pink-500">{scale}px</span>
                    </div>
                    <select 
                      value={scale}
                      onChange={(e) => setScale(parseInt(e.target.value))}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-pink-500"
                    >
                       <option className="bg-black text-white" value={320}>320px (Mobile-friendly)</option>
                       <option className="bg-black text-white" value={480}>480px (Balanced)</option>
                       <option className="bg-black text-white" value={640}>640px (High Res)</option>
                       <option className="bg-black text-white" value={800}>800px (Desktop)</option>
                    </select>
                 </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                 <h5 className="text-[10px] font-bold text-white uppercase tracking-widest">Hygiene Status</h5>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Processing is conducted entirely in local volatile memory. Frames are discarded immediately after encoding.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
