import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles, Type, Plus } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import * as fabric from "fabric"

export function MemeGenerator() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvas = useRef<fabric.Canvas | null>(null)

  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    
    const img = new Image()
    img.src = objectUrl
    img.onload = () => {
      if (!canvasRef.current) return
      
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 600,
        height: 600,
        backgroundColor: "#000"
      })
      fabricCanvas.current = canvas

      fabric.FabricImage.fromURL(objectUrl).then((fbImg) => {
        const scale = Math.min(600 / fbImg.width!, 600 / fbImg.height!)
        fbImg.scale(scale)
        fbImg.set({ selectable: false, evented: false })
        canvas.add(fbImg)
        canvas.centerObject(fbImg)
        canvas.renderAll()
        
        // Add default top/bottom texts
        addMemeText("TOP TEXT", "top")
        addMemeText("BOTTOM TEXT", "bottom")
      })
    }

    return () => {
      URL.revokeObjectURL(objectUrl)
      fabricCanvas.current?.dispose()
    }
  }, [file])

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
  }

  const handleDownload = () => {
    if (!fabricCanvas.current) return
    setIsProcessing(true)
    const dataUrl = fabricCanvas.current.toDataURL({ format: "png", quality: 1 })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `vanity-meme-${Date.now()}.png`
    a.click()
    setIsProcessing(false)
    toast.success("Meme exported!")
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
        <DropZone onDrop={(f) => { if (validateFiles(f)) setFile(f[0]); }} accept={{ "image/*": [] }} />
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
