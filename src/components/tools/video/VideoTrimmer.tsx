import React, { useEffect, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Video, Download, RefreshCw, Scissors, Clock, Zap } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { useProcessingState } from "@/hooks/useProcessingState"
import { runFFmpegJob } from "@/lib/ffmpeg-job"
import { toast } from "sonner"

export function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const { url: sourceUrl, setUrl: setSourceUrl, clear: clearSourceUrl } = useObjectUrl()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  
  const [startTime, setStartTime] = useState("00:00:00")
  const [endTime, setEndTime] = useState("00:00:10")

  useEffect(() => {
    return () => {
      clearSourceUrl()
    }
  }, [clearSourceUrl])

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setSourceUrl(files[0])
      clearResultUrl()
    }
  }

  const trimVideo = async () => {
    if (!file || !startTime || !endTime) return
    
    startProcessing()
    const ext = file.name.split('.').pop() || "mp4"
    const inputName = `input.${ext}`
    const outputName = `output.${ext}`

    try {
      const data = await runFFmpegJob({
        file,
        inputName,
        outputName,
        args: [
          "-i", inputName,
          "-ss", startTime,
          "-to", endTime,
          "-c", "copy",
          outputName
        ],
        onProgress: (p) => updateProgress(p)
      })

      const blob = new Blob([data as any], { type: `video/${ext}` })
      setResultUrl(blob)
      toast.success("Video trimmed successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Trimming failed. Check timestamps.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultUrl || !file) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `Trimmed-${file.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!file) {
    return (
      <ToolUploadLayout 
        title="Video Trimmer" 
        description="Extract exact segments from your videos locally. Direct bitstream copying prevents quality loss." 
        icon={Scissors}
      >
        <DropZone 
          onDrop={handleDrop} 
          accept={{ "video/*": [".mp4", ".mov", ".webm", ".mkv", ".avi"] }}
          label="Drop video to trim"
        />
        <div className="flex justify-center mt-12 gap-8 max-w-2xl mx-auto opacity-70">
           <div className="flex flex-col items-center text-center gap-2">
              <Zap className="w-6 h-6 text-purple-400" />
              <p className="text-sm font-medium">Instant Copy</p>
              <p className="text-xs text-muted-foreground">No re-encoding delays.</p>
           </div>
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Video Trimmer"
      description={file.name}
      icon={Scissors}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
              {isProcessing ? (
                <div className="space-y-6 text-center z-10 w-full max-w-sm">
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Slicing Bitstream...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">I-Frame mapping</p>
                   </div>
                </div>
              ) : resultUrl ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center w-full z-10">
                    <div className="relative inline-block w-full text-center">
                       <video 
                         src={resultUrl} 
                         controls 
                         className="max-h-[350px] mx-auto rounded-xl border border-white/10 shadow-2xl" 
                       />
                    </div>
                    <button 
                      onClick={handleDownload}
                      className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                    >
                      <Download className="w-6 h-6" /> Export </button>
                 </div>
               ) : (
                <div className="text-center space-y-8 z-10">
                    <div className="inline-flex items-center justify-center p-6 bg-purple-500/10 rounded-full border border-purple-500/20">
                       <Video className="w-12 h-12 text-purple-400" />
                    </div>
                    <div className="w-full max-w-xl mx-auto">
                      <video
                        src={sourceUrl || ""}
                        controls
                        preload="metadata"
                        className="max-h-[260px] w-full rounded-xl border border-white/10 shadow-2xl bg-black/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold font-syne text-white">Ready to Slice</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                         Set your IN and OUT timestamps to extract exactly the footage you need without losing original quality.
                      </p>
                      {file.size > 200 * 1024 * 1024 && (
                        <p className="text-[10px] text-amber-300/80 uppercase tracking-widest font-bold">
                          Large video detected — loading and trimming may take longer.
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={trimVideo}
                      className="px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mx-auto"
                    >
                      <Scissors className="w-5 h-5" /> Execute Trim
                    </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="p-8 glass-panel rounded-3xl space-y-8 border-white/10">
              <div>
                 <label className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                   <Clock className="w-4 h-4" /> Start Time (HH:MM:SS)
                 </label>
                 <input
                   type="text"
                   value={startTime}
                   onChange={(e) => setStartTime(e.target.value)}
                   pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest focus:border-purple-500/50 outline-none transition-colors"
                 />
              </div>

              <div>
                 <label className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                   <Clock className="w-4 h-4" /> End Time (HH:MM:SS)
                 </label>
                 <input
                   type="text"
                   value={endTime}
                   onChange={(e) => setEndTime(e.target.value)}
                   pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center tracking-widest focus:border-purple-500/50 outline-none transition-colors"
                 />
              </div>
              
              <div className="p-5 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-xs text-purple-200/70 leading-relaxed font-medium">
                We leverage stream-copying for instant results. The slice occurs at the nearest I-Frame.
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
