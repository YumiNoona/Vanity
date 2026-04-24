import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles, Type, Plus } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import * as fabric from "fabric"
import { loadImage, downloadBlob, exportCanvas } from "@/lib/canvas"
import { guardDimensions } from "@/lib/utils"

export function MemeGenerator() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<fabric.Canvas | null>(null)
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
    setFile(uploadedFile)
    
    try {
      if (uploadedFile.type.startsWith('video/')) {
         const url = URL.createObjectURL(uploadedFile)
         const video = document.createElement('video')
         video.src = url
         video.crossOrigin = "anonymous"
         video.loop = true
         video.muted = true // Required for autoplay without interaction
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
      
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }
    } catch (e) {
      if (jobId === jobIdRef.current) toast.error("Failed to load media")
    }
  }

  useEffect(() => {
    if (sourceData && canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 600,
        height: 600,
        backgroundColor: "#000"
      })
      fabricCanvas.current = canvas

      canvas.on("selection:created", () => setHasSelection(true))
      canvas.on("selection:updated", () => setHasSelection(true))
      canvas.on("selection:cleared", () => setHasSelection(false))

      const fbMedia = new fabric.FabricImage(sourceData.source)
      const scale = Math.min(600 / sourceData.width, 600 / sourceData.height)
      fbMedia.scale(scale)
      fbMedia.set({ selectable: false, evented: false })
      canvas.add(fbMedia)
      canvas.centerObject(fbMedia)
      canvas.requestRenderAll()
      
      if (sourceData.type === 'video' && videoRef.current) {
         videoRef.current.play()
         const renderLoop = () => {
            if (!unmountedRef.current && fabricCanvas.current && !isRecording) {
               fabricCanvas.current.requestRenderAll()
               fabric.util.requestAnimFrame(renderLoop)
            }
         }
         fabric.util.requestAnimFrame(renderLoop)
      }
      
      addMemeText("TOP TEXT", "top")
      addMemeText("BOTTOM TEXT", "bottom")
    }

    return () => {
       if (fabricCanvas.current) {
          fabricCanvas.current.dispose()
          fabricCanvas.current = null
          if (canvasRef.current) {
            canvasRef.current.width = 0
            canvasRef.current.height = 0
          }
       }
    }
  }, [sourceData])

  const addMemeText = (content: string, pos: 'top' | 'bottom' | 'free' = 'free') => {
    if (!fabricCanvas.current) return
    const text = new fabric.IText(content, {
      left: 300,
      top: pos === 'top' ? 50 : pos === 'bottom' ? 500 : 300,
      fontFamily: "Impact, Syne, sans-serif",
      fontSize: 50,
      fill: "white",
      stroke: "black",
      strokeWidth: 2,
      fontWeight: "bold",
      textAlign: "center",
      originX: "center",
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
      activeObjects.forEach(obj => canvas.remove(obj))
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
         // Video Export using MediaRecorder
         setIsRecording(true)
         const video = videoRef.current
         video.currentTime = 0
         await video.play()

         const canvasEl = fabricCanvas.current.getElement()
         const stream = canvasEl.captureStream(30) // 30 FPS
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
            
            // Resume preview render loop
            const renderLoop = () => {
               if (!unmountedRef.current && fabricCanvas.current && !isRecording) {
                  fabricCanvas.current.requestRenderAll()
                  fabric.util.requestAnimFrame(renderLoop)
               }
            }
            fabric.util.requestAnimFrame(renderLoop)
         }

         recorder.start()
         
         const renderFrame = () => {
             if (!unmountedRef.current && fabricCanvas.current && isRecording) {
                 fabricCanvas.current.renderAll()
             }
         }

         // Stop recording when video ends
         const onEnded = () => {
            recorder.stop()
            video.removeEventListener('ended', onEnded)
            video.loop = true
            video.play()
         }
         
         video.loop = false // Play once for recording
         video.addEventListener('ended', onEnded)
         
         const animLoop = () => {
            if (isRecording) {
               renderFrame()
               fabric.util.requestAnimFrame(animLoop)
            }
         }
         fabric.util.requestAnimFrame(animLoop)
         
      } else {
         // Image Export
         const fabricElement = fabricCanvas.current.toCanvasElement(1)
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
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Meme Generator" description="Upload an image or video template and create viral memes instantly in your browser." icon={Sparkles}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [], "video/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Meme Station" description="Double click text to edit. Drag to reposition." onBack={handleBack} backLabel="Change Template" maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-panel p-6 rounded-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Controls</h3>
              <button 
                onClick={() => addMemeText("NEW TEXT")}
                className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center hover:bg-white/10 transition-all group"
              >
                <Plus className="w-6 h-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Add Text Layer</span>
              </button>

              {hasSelection && (
                <button 
                  onClick={deleteSelected}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                >
                  Delete Selected Layer
                </button>
              )}
              
              <button 
                onClick={handleDownload}
                disabled={isProcessing || isRecording}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isProcessing || isRecording ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5" />}
                {isRecording ? "Recording Meme..." : "Download Meme"}
              </button>
           </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl flex items-center justify-center bg-black min-h-[600px] shadow-2xl relative overflow-auto">
           <canvas ref={canvasRef} />
        </div>
      </div>
    </ToolLayout>
  )
}
