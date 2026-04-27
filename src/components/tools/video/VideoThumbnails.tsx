import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ImagePlay, Loader2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"

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
  const isUnmountedRef = useRef(false)

  const waitForEvent = (target: HTMLMediaElement, eventName: string, timeoutMs: number) => {
    return new Promise<void>((resolve, reject) => {
      const onEvent = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error("Video decode failed. Try a different format or smaller file."))
      }
      const timeoutId = window.setTimeout(() => {
        cleanup()
        reject(new Error("Timed out while decoding video frames. Try fewer frames or a smaller file."))
      }, timeoutMs)

      const cleanup = () => {
        window.clearTimeout(timeoutId)
        target.removeEventListener(eventName, onEvent)
        target.removeEventListener("error", onError)
      }

      target.addEventListener("error", onError, { once: true })
      target.addEventListener(eventName, onEvent, { once: true })
    })
  }

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setVideoUrl(files[0])
      clearThumbnails()
      setProgress(0)
      setIsExtracting(false)
    }
  }

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      const video = videoRef.current
      if (video) {
        video.onloadedmetadata = null
      }
    }
  }, [])

  const extractFrames = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !file || isExtracting) return

    setIsExtracting(true)
    clearThumbnails()
    setProgress(0)

    try {
      // Ensure video metadata loaded
      if (video.readyState < 1) {
        video.load()
        await waitForEvent(video, "loadedmetadata", 15000)
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
         await waitForEvent(video, "seeked", 12000)
         if (isUnmountedRef.current) return

         ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
         
         const blob = await new Promise<Blob>((resolve) => 
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
         )
         if (!isUnmountedRef.current) {
           addUrl(blob)
         }
         
         if (!isUnmountedRef.current) {
           setProgress(Math.round((i / frameCount) * 100))
         }
      }

    } catch (e: any) {
      console.error(e)
      if (!isUnmountedRef.current) {
        toast.error(e?.message || "Failed to extract frames.")
        setProgress(0)
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsExtracting(false)
      }
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
       <ToolUploadLayout title="Video Grid Extractor" description="Rapidly pull high-resolution thumbnail grids from any local video file securely." icon={ImagePlay}>
         <DropZone onDrop={handleDrop} accept={{ "video/*": [] }} label="Drop MP4, WebM, MOV" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Video Grid Extractor" description={file.name} icon={ImagePlay} centered={true} maxWidth="max-w-6xl">

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
              className="py-3 px-8 bg-primary text-primary-foreground font-bold rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
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
            <button 
              onClick={() => { setFile(null); clearVideoUrl(); clearThumbnails(); }}
              className="py-3 px-6 bg-white/5 text-white font-bold rounded-lg border border-white/10 transition-all text-xs"
            >
              Start New
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
                           <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
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
    </ToolLayout>
  )
}
