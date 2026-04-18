import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, ImagePlay, Loader2 } from "lucide-react"

import { useObjectUrl, useObjectUrls } from "@/hooks/useObjectUrl"

export function VideoThumbnails() {
  const [file, setFile] = useState<File | null>(null)
  const { url: videoUrl, setUrl: setVideoUrl, clear: clearVideoUrl } = useObjectUrl()
  
  const [frameCount, setFrameCount] = useState<number>(9)
  const { urls: thumbnails, addUrl, clear: clearThumbnails } = useObjectUrls()
  
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setVideoUrl(files[0])
      clearThumbnails()
      setProgress(0)
    }
  }

  const extractFrames = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !file || isExtracting) return

    setIsExtracting(true)
    setThumbnails([])
    setProgress(0)

    try {
      // Ensure video metadata loaded
      if (video.readyState < 1) {
         await new Promise(resolve => {
           video.onloadedmetadata = resolve
         })
      }

      const duration = video.duration
      if (!duration || !isFinite(duration)) throw new Error("Invalid video duration")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Failed to get 2d context")

      const generated: string[] = []
      const step = duration / (frameCount + 1)

      // Sequentially seek and extract
      for (let i = 1; i <= frameCount; i++) {
         const targetTime = step * i
         video.currentTime = targetTime
         
         // Wait for seek strictly
         await new Promise(resolve => {
            const onSeeked = () => {
               video.removeEventListener("seeked", onSeeked)
               resolve(true)
            }
            video.addEventListener("seeked", onSeeked)
         })

         ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
         
         const blob = await new Promise<Blob>((resolve) => 
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
         )
         addUrl(blob)
         
         setProgress(Math.round((i / frameCount) * 100))
      }

    } catch (e) {
      console.error(e)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDownloadAll = () => {
    if (!file) return
    thumbnails.forEach((url, i) => {
       const a = document.createElement("a")
       a.href = url
       a.download = `vanity-frame-${i+1}-${file.name}.jpg`
       a.click()
    })
  }

  if (!file || !videoUrl) {
    return (
       <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-6 text-indigo-500">
            <ImagePlay className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">Video Grid Extractor</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Rapidly pull high-resolution thumbnail grids from any local video file securely.
         </p>
         <DropZone onDrop={handleDrop} accept={{ "video/*": [] }} label="Drop MP4, WebM, MOV" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20 mt-4">
      
      {/* Hidden processing buffers */}
      <video ref={videoRef} src={videoUrl} preload="auto" muted className="hidden" crossOrigin="anonymous" playsInline />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
             <ImagePlay className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-2xl font-bold font-syne text-white">Contact Sheet</h1>
             <p className="text-muted-foreground text-sm font-mono">{file.name}</p>
           </div>
        </div>
        <button onClick={() => { setFile(null); clearVideoUrl(); clearThumbnails(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Load Different
        </button>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8 border-indigo-500/10">
         
         <div className="flex flex-wrap gap-4 items-end bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="flex-1 min-w-[200px]">
               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Frame Count</label>
               <input 
                 type="range"
                 min="3" max="24"
                 value={frameCount}
                 onChange={(e) => setFrameCount(Number(e.target.value))}
                 className="w-full accent-indigo-500"
               />
               <div className="text-xs text-muted-foreground text-right mt-1 font-mono">{frameCount} frames</div>
            </div>
            
            <button 
              onClick={extractFrames}
              disabled={isExtracting}
              className="py-3 px-8 bg-indigo-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-400 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress}%</> : "Extract Frames"}
            </button>
            <button 
              onClick={handleDownloadAll}
              disabled={isExtracting || thumbnails.length === 0}
              className="py-3 px-6 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 flex items-center gap-2"
              title="Download All JPGs Arrayed"
            >
              <Download className="w-4 h-4" /> All
            </button>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 min-h-[300px]">
            {thumbnails.length > 0 ? (
               thumbnails.map((url, i) => (
                 <div key={i} className="group relative aspect-video bg-black/50 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all">
                    <img src={url} alt={`Frame ${i}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 rounded backdrop-blur text-[10px] font-bold text-white border border-white/10">#{i+1}</div>
                    
                    <a 
                      href={url}
                      download={`vanity-frame-${i+1}-${file.name}.jpg`}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-white hover:text-indigo-400"
                    >
                      <Download className="w-8 h-8" />
                    </a>
                 </div>
               ))
            ) : (
               <div className="col-span-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 gap-4 py-12">
                  {isExtracting ? (
                     <>
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        <p className="font-mono text-sm">Decoding frames sequentially...</p>
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                           <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                     </>
                  ) : (
                     <>
                        <ImagePlay className="w-12 h-12 stroke-[1]" />
                        <p>No frames extracted yet.</p>
                     </>
                  )}
               </div>
            )}
         </div>

      </div>
    </div>
  )
}
