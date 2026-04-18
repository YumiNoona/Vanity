import React, { useState, useCallback, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Images, Download, RefreshCw, Trash2, SlidersHorizontal, AlertCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import gifshot from "gifshot"
import { guardDimensions, maybeYield, safeRevoke } from "@/lib/utils"

const MAX_FRAMES = 20
const MAX_TOTAL_PX = 50_000_000
const ENCODE_TIMEOUT = 20000 // 20s safety

type ProgressStage = "idle" | "processing" | "encoding" | "finalizing"

export function GifMaker() {
  const [files, setFiles] = useState<File[]>([])
  const [delay, setDelay] = useState(200) // ms
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressStage, setProgressStage] = useState<ProgressStage>("idle")
  const [resultGif, setResultGif] = useState<string | null>(null)
  
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const prevPreviewsRef = useRef<string[]>([])
  
  const isCancelledRef = useRef(false)
  const activeUrlsRef = useRef<string[]>([])

  const updateActiveUrls = (newUrls: string[]) => {
    safeRevoke(activeUrlsRef.current)
    activeUrlsRef.current = newUrls
  }

  const updatePreviews = (newFiles: File[]) => {
    prevPreviewsRef.current.forEach(u => URL.revokeObjectURL(u))
    const urls = newFiles.map(f => URL.createObjectURL(f))
    prevPreviewsRef.current = urls
    setPreviewUrls(urls)
  }

  useEffect(() => {
    updatePreviews(files)
  }, [files])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      safeRevoke(activeUrlsRef.current)
      prevPreviewsRef.current.forEach(u => URL.revokeObjectURL(u))
      isCancelledRef.current = true
    }
  }, [])

  const handleDrop = useCallback((newFiles: File[]) => {
    const total = files.length + newFiles.length
    if (total > MAX_FRAMES) {
      toast.error(`Maximum ${MAX_FRAMES} frames allowed.`)
      const allowed = newFiles.slice(0, MAX_FRAMES - files.length)
      setFiles(prev => [...prev, ...allowed])
    } else {
      setFiles(prev => [...prev, ...newFiles])
    }
    setResultGif(null)
  }, [files])

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setResultGif(null)
  }

  const cancelTask = () => {
    isCancelledRef.current = true
    setIsProcessing(false)
    setProgressStage("idle")
    toast.info("Task cancelled")
  }

  const generateGif = async () => {
    if (files.length < 2) {
      toast.error("Add at least 2 images for a GIF.")
      return
    }

    isCancelledRef.current = false
    setIsProcessing(true)
    setProgressStage("processing")
    const startTime = performance.now()

    try {
      // 1. Process & Rezise Frames with time-budget yielding
      const frameUrls: string[] = []
      let aggregatePixels = 0

      for (let i = 0; i < files.length; i++) {
        if (isCancelledRef.current) return

        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              const { w, h } = guardDimensions(img.width, img.height)
              aggregatePixels += w * h
              
              if (aggregatePixels > MAX_TOTAL_PX) {
                reject(new Error("Image set is too large for device memory. Reduce frames or resolution."))
                return
              }

              const canvas = document.createElement("canvas")
              canvas.width = w
              canvas.height = h
              const ctx = canvas.getContext("2d")
              if (ctx) {
                ctx.imageSmoothingEnabled = true
                ctx.drawImage(img, 0, 0, w, h)
              }
              const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
              
              // Memory cleanup
              canvas.width = 0
              canvas.height = 0
              resolve(dataUrl)
            }
            img.src = e.target?.result as string
          }
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsDataURL(files[i])
        })

        frameUrls.push(url)
        if (i % 2 === 0) await maybeYield()
      }

      if (isCancelledRef.current) {
        safeRevoke(frameUrls)
        return
      }

      setProgressStage("encoding")
      updateActiveUrls(frameUrls)

      // 2. Encode with Gifshot logic
      const effectiveDelay = Math.max(20, delay) // Enforce min 20ms delay

      gifshot.createGIF({
        images: frameUrls,
        interval: effectiveDelay / 1000, 
        gifWidth: 800,
        gifHeight: 800,
        numWorkers: 2,
        sampleInterval: 10, // Palette quality vs speed
      }, (obj: any) => {
        if (isCancelledRef.current) return

        if (!obj.error) {
           if (performance.now() - startTime > ENCODE_TIMEOUT) {
              toast.error("Processing timeout—try fewer frames")
              setIsProcessing(false)
              return
           }
           setProgressStage("finalizing")
           setResultGif(obj.image)
           toast.success("GIF generated!")
        } else {
           toast.error(obj.errorMsg || "GIF encoding failed")
        }
        setIsProcessing(false)
        setProgressStage("idle")
      })
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
      setIsProcessing(false)
      setProgressStage("idle")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mt-4 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
             <Images className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">GIF Maker</h1>
            <p className="text-muted-foreground text-sm">Combine image sequence into an animated GIF.</p>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <DropZone onDrop={handleDrop} accept={{"image/*": []}} multiple label="Add Frames (Max 20)" />
           
           {files.length > 0 && (
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {files.map((_, idx) => (
                   <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <img src={previewUrls[idx]} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-bold text-white uppercase">
                        Frame {idx + 1}
                      </div>
                   </div>
                ))}
             </div>
           )}

           {resultGif && (
             <div className="glass-panel p-6 rounded-3xl border-primary/20 space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Generated Result</h3>
               <div className="flex justify-center bg-black/40 rounded-2xl p-4 min-h-[300px] items-center">
                  <img src={resultGif} className="max-w-full rounded-lg shadow-2xl shadow-primary/10" alt="Generated GIF" />
               </div>
               <div className="flex justify-end">
                  <a 
                    href={resultGif} 
                    download={`vanity-anim-${Date.now()}.gif`}
                    className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    <Download className="w-5 h-5" /> Download GIF
                  </a>
               </div>
             </div>
           )}
        </div>

        <div className="space-y-6">
           <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-3 text-white border-b border-white/5 pb-4">
                 <SlidersHorizontal className="w-4 h-4 text-primary" />
                 <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs text-muted-foreground uppercase font-bold">
                    <span>Frame Delay</span>
                    <span className="text-primary font-mono">{delay}ms</span>
                 </div>
                 <input 
                   type="range" 
                   min="50" 
                   max="1000" 
                   step="50" 
                   value={delay} 
                   onChange={(e) => setDelay(parseInt(e.target.value))}
                   className="w-full accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                 />
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 border-dashed space-y-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    Optimal Performance
                 </div>
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   Images are automatically downscaled to 800px to ensure local memory safety and faster encoding.
                 </p>
              </div>

              <div className="space-y-3">
                 <button 
                   onClick={generateGif}
                   disabled={files.length < 2 || isProcessing}
                   className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-amber-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3"
                 >
                   {isProcessing ? (
                     <>
                       <RefreshCw className="w-5 h-5 animate-spin" />
                       <span>
                         {progressStage === "processing" && "Processing Frames..."}
                         {progressStage === "encoding" && "Encoding GIF..."}
                         {progressStage === "finalizing" && "Finalizing..."}
                       </span>
                     </>
                   ) : (
                     <>
                       <Images className="w-5 h-5" />
                       <span>Create GIF</span>
                     </>
                   )}
                 </button>

                 {isProcessing && (
                    <button 
                      onClick={cancelTask}
                      className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                       <XCircle className="w-4 h-4" /> Cancel Process
                    </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
