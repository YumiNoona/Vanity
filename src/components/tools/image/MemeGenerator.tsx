import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, Plus, MessageSquare, RefreshCw, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

import { loadImage, downloadBlob, exportCanvas } from "@/lib/canvas"
import { guardDimensions } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function MemeGenerator() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<any>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const unmountedRef = useRef(false)
  const jobIdRef = useRef(0)

  useEffect(() => {
    return () => {
      unmountedRef.current = true
      if (cleanupRef.current) cleanupRef.current()
    }
  }, [])

  const [sourceData, setSourceData] = useState<{source: any, width: number, height: number, type: 'image' | 'video'} | null>(null)
  const [hasSelection, setHasSelection] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    
    const jobId = ++jobIdRef.current
    setIsLoadingMedia(true)
    setFile(uploadedFile)
    
    try {
      if (uploadedFile.type.startsWith('video/')) {
         const url = URL.createObjectURL(uploadedFile)
         const video = document.createElement('video')
         video.src = url
         video.crossOrigin = "anonymous"
         video.loop = true
         video.muted = true
         video.playsInline = true
         
         await new Promise((resolve, reject) => {
           video.onloadedmetadata = resolve
           video.onerror = reject
         })
         
         if (jobId !== jobIdRef.current || unmountedRef.current) return
         
         if (cleanupRef.current) cleanupRef.current()
         cleanupRef.current = () => { URL.revokeObjectURL(url); video.pause(); video.src = ""; }
         
         const { width, height } = guardDimensions(video.videoWidth, video.videoHeight)
         videoRef.current = video
         setSourceData({ source: video, width, height, type: 'video' })
         
      } else {
         const result = await loadImage(uploadedFile)
         
         if (jobId !== jobIdRef.current || unmountedRef.current) {
           result.cleanup()
           return
         }

         if (cleanupRef.current) cleanupRef.current()
         cleanupRef.current = result.cleanup

         const { width, height } = guardDimensions(result.width, result.height)
         setSourceData({ source: result.source, width, height, type: 'image' })
      }
    } catch (e) {
      if (jobId === jobIdRef.current) toast.error("Failed to load media")
    } finally {
      if (jobId === jobIdRef.current) setIsLoadingMedia(false)
    }
  }

  useEffect(() => {
    if (sourceData && canvasRef.current) {
      const initFabric = async () => {
        const fabricModule = await import("fabric")
        const fabric: any = fabricModule.default || fabricModule;
        
        if (unmountedRef.current) return

        // 1. Dispose previous canvas if it exists
        if (fabricCanvas.current) {
           fabricCanvas.current.dispose()
           fabricCanvas.current = null
        }

        const el = canvasRef.current!
        const canvas = new (fabric.Canvas || fabricModule.Canvas)(el, {
          width: 600,
          height: 600,
          backgroundColor: "#000",
          preserveObjectStacking: true
        })

        // DOUBLE CHECK: If we unmounted during the async import/creation, kill it now
        if (unmountedRef.current) {
           canvas.dispose()
           return
        }

        fabricCanvas.current = canvas

        canvas.on("selection:created", () => setHasSelection(true))
        canvas.on("selection:updated", () => setHasSelection(true))
        canvas.on("selection:cleared", () => setHasSelection(false))

        // 2. Specialized Media Initialization
        let fbMedia: any;
        
        if (sourceData.type === "image") {
           const isImgEl = sourceData.source instanceof HTMLImageElement;
           if ((fabric.Image?.fromURL || fabricModule.Image?.fromURL) && isImgEl) {
              fbMedia = await (fabric.Image?.fromURL || fabricModule.Image?.fromURL)(sourceData.source.src, {
                 crossOrigin: "anonymous"
              });
           } else {
              const ImageClass = fabric.FabricImage || fabricModule.FabricImage || fabric.Image || fabricModule.Image;
              fbMedia = new ImageClass(sourceData.source, {
                 crossOrigin: "anonymous"
              });
           }
        } else {
           const ImageClass = fabric.FabricImage || fabricModule.FabricImage || fabric.Image || fabricModule.Image;
           fbMedia = new ImageClass(videoRef.current, {
              crossOrigin: "anonymous",
              objectCaching: false 
           });
        }

        if (unmountedRef.current || !fabricCanvas.current) {
           canvas.dispose()
           return
        }

        const scale = Math.min(600 / sourceData.width, 600 / sourceData.height)
        fbMedia.scale(scale)
        fbMedia.set({ 
          selectable: false, 
          evented: false,
          originX: 'center',
          originY: 'center',
          left: 300,
          top: 300
        })
        
        canvas.add(fbMedia)
        canvas.sendObjectToBack(fbMedia)
        canvas.requestRenderAll()
        
        if (sourceData.type === 'video' && videoRef.current) {
            videoRef.current.play()
            const renderLoop = () => {
              if (!unmountedRef.current && fabricCanvas.current && !isRecording) {
                 fabricCanvas.current.requestRenderAll()
                 if (fabric.util?.requestAnimFrame) {
                    fabric.util.requestAnimFrame(renderLoop)
                 } else {
                    requestAnimationFrame(renderLoop)
                 }
              }
            }
            requestAnimationFrame(renderLoop)
        }
        
        setTimeout(async () => {
           if (unmountedRef.current || !fabricCanvas.current) return;
           await addMemeText("TOP TEXT", "top")
           await addMemeText("BOTTOM TEXT", "bottom")
        }, 100);
      }
      initFabric()
    }

    return () => {
       if (fabricCanvas.current) {
          fabricCanvas.current.dispose()
          fabricCanvas.current = null
       }
    }
  }, [sourceData])

  const addMemeText = async (content: string, pos: 'top' | 'bottom' | 'free' = 'free') => {
    if (!fabricCanvas.current) return
    const fabricModule = await import("fabric")
    const fabric: any = fabricModule.default || fabricModule;
    
    const TextClass = fabric.IText || fabricModule.IText;
    const text = new TextClass(content, {
      left: 300,
      top: pos === 'top' ? 80 : pos === 'bottom' ? 520 : 300,
      fontFamily: "Impact, Syne, sans-serif",
      fontSize: 54,
      fill: "white",
      stroke: "black",
      strokeWidth: 2,
      fontWeight: "bold",
      textAlign: "center",
      originX: "center",
      originY: "center",
      cornerColor: "#F59E0B",
      cornerStyle: "circle",
      transparentCorners: false,
      padding: 10
    })
    
    fabricCanvas.current.add(text)
    fabricCanvas.current.setActiveObject(text)
    fabricCanvas.current.requestRenderAll()
  }

  const deleteSelected = () => {
    const canvas = fabricCanvas.current
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach((obj: any) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.requestRenderAll()
      setHasSelection(false)
      toast.success("Layer removed")
    }
  }

  const handleDownload = async () => {
    if (!fabricCanvas.current || !sourceData) return
    setIsProcessing(true)
    
    try {
      if (sourceData.type === 'video' && videoRef.current) {
         setIsRecording(true)
         const video = videoRef.current
         video.currentTime = 0
         await video.play()

         const canvasEl = fabricCanvas.current.getElement()
         const stream = canvasEl.captureStream(30)
         const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
         const chunks: Blob[] = []

         recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data)
         }

         recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' })
            downloadBlob(blob, `vanity-meme-${Date.now()}.webm`)
            toast.success("Video Meme exported!")
            setIsRecording(false)
            setIsProcessing(false)
            stream.getTracks().forEach((track: any) => track.stop())
         }

         recorder.start()
         
         const onEnded = () => {
            recorder.stop()
            video.removeEventListener('ended', onEnded)
            video.loop = true
            video.play()
         }
         
         video.loop = false
         video.addEventListener('ended', onEnded)
         
         const animLoop = () => {
            if (isRecording) {
               fabricCanvas.current.renderAll()
               requestAnimationFrame(animLoop)
            }
         }
         requestAnimationFrame(animLoop)
         
      } else {
         const fabricElement = fabricCanvas.current.toCanvasElement(2) 
         const blob = await exportCanvas(fabricElement, "image/png", 1.0)
         downloadBlob(blob, `vanity-meme-${Date.now()}.png`)
         toast.success("Meme exported!")
         setIsProcessing(false)
      }
    } catch (error) {
      toast.error("Export failed")
      setIsProcessing(false)
      setIsRecording(false)
    }
  }

  const handleBack = () => {
    setFile(null)
    setSourceData(null)
    if (cleanupRef.current) cleanupRef.current()
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Meme Generator" description="Upload an image or video template and create viral memes instantly in your browser." icon={MessageSquare}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [], "video/*": [] }} label="Drop image or video here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Meme Generator" 
      description="Double click text to edit. Drag to reposition." 
      icon={MessageSquare} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6 bg-black/20">
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Creative Controls
                 </h3>
                 
                 <button 
                   onClick={() => addMemeText("NEW TEXT")}
                   className="w-full py-5 bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 hover:border-primary/50 transition-all group"
                 >
                   <Plus className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-black uppercase tracking-widest">Add Text Layer</span>
                 </button>
  
                 {hasSelection && (
                   <button 
                     onClick={deleteSelected}
                     className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2"
                   >
                     <Trash2 className="w-3.5 h-3.5" /> Remove Layer
                   </button>
                 )}
              </div>

              <div className="h-px bg-white/5" />
              
              <div className="space-y-3">
                 <button 
                   onClick={handleDownload}
                   disabled={isProcessing || isRecording || isLoadingMedia}
                   className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isProcessing || isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                   {isRecording ? "Recording..." : "Export Meme"}
                 </button>
  
                 <button 
                   onClick={handleBack}
                   className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/10 transition-all"
                 >
                   Change Template
                 </button>
              </div>
           </div>

           <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
              <div className="p-2 bg-primary/10 rounded-lg h-fit">
                <Plus className="w-3 h-3 text-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-medium">
                Double click any text layer to change content. Use the export button for a high-quality production render.
              </p>
           </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-4 rounded-3xl flex items-center justify-center bg-[#050505] min-h-[600px] shadow-2xl relative overflow-hidden group/canvas border border-white/5">
           {isLoadingMedia && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                 <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Initializing Template...</span>
              </div>
           )}
           
           <div className="relative shadow-[0_30px_70px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden bg-black w-[600px] h-[600px]">
              <canvas 
                ref={canvasRef} 
                width={600}
                height={600}
                className="w-[600px] h-[600px]"
              />
              {sourceData && !isLoadingMedia && (
                 <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Production View</span>
                 </div>
              )}
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
