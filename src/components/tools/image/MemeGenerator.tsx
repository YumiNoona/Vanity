import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles, Type, Plus } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import * as fabric from "fabric"
import { loadImage, downloadBlob, exportCanvas } from "@/lib/canvas"
import { guardDimensions, maybeYield } from "@/lib/utils"

export function MemeGenerator() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<fabric.Canvas | null>(null)

  const [sourceData, setSourceData] = useState<{source: any, width: number, height: number} | null>(null)
  const [hasSelection, setHasSelection] = useState(false)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setFile(uploadedFile)
    try {
      const result = await loadImage(uploadedFile)
      const { width, height } = guardDimensions(result.width, result.height)
      setSourceData({ source: result.source, width, height })
      
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose()
        fabricCanvas.current = null
      }
    } catch (e) {
      toast.error("Failed to load image")
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

      const fbImg = new fabric.FabricImage(sourceData.source as HTMLImageElement)
      const scale = Math.min(600 / sourceData.width, 600 / sourceData.height)
      fbImg.scale(scale)
      fbImg.set({ selectable: false, evented: false })
      canvas.add(fbImg)
      canvas.centerObject(fbImg)
      canvas.requestRenderAll()
      
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
    if (!fabricCanvas.current) return
    setIsProcessing(true)
    
    try {
      const fabricElement = fabricCanvas.current.toCanvasElement(1)
      
      const blob = await exportCanvas(fabricElement, "image/png", 1.0)
      downloadBlob(blob, `vanity-meme-${Date.now()}.png`)
      toast.success("Meme exported!")
    } catch (error) {
      toast.error("Export failed")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Sparkles className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Meme Generator</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Upload a template and create viral memes instantly in your browser.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Meme Station</h1>
          <p className="text-muted-foreground text-sm">Double click text to edit. Drag to reposition.</p>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change Template
        </button>
      </div>

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
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] transition-all"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5" />}
                Download Meme
              </button>
           </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl flex items-center justify-center bg-black min-h-[600px] shadow-2xl relative overflow-auto">
           <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
