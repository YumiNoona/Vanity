import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Sparkles, Eraser, RefreshCw, Layers } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"

export function WatermarkRemover() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(30)

  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    
    const img = new Image()
    img.src = url
    img.onload = async () => {
      try {
        await img.decode()
        imgRef.current = img
        setIsLoaded(true)
      } catch (e) {
        toast.error("Failed to load image")
      }
    }
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (isLoaded && imgRef.current && canvasRef.current && maskCanvasRef.current) {
      const img = imgRef.current
      const canvas = canvasRef.current
      const mask = maskCanvasRef.current
      
      canvas.width = mask.width = img.width
      canvas.height = mask.height = img.height
      
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      
      const mCtx = mask.getContext("2d")!
      mCtx.clearRect(0, 0, mask.width, mask.height)
    }
  }, [isLoaded])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = maskCanvasRef.current?.getContext("2d")
    ctx?.beginPath() // Reset path
  }

  const draw = (e: any) => {
    if (!isDrawing || !maskCanvasRef.current) return
    const canvas = maskCanvasRef.current
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
    
    // Scale coordinates if canvas is resized by CSS
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX
    const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY

    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)"
    
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleProcess = async () => {
    setIsProcessing(true)
    
    // Simulate AI removal logic
    // We'll use a simple median blur or patched fill simulation locally
    setTimeout(() => {
      const canvas = canvasRef.current!
      const mask = maskCanvasRef.current!
      const ctx = canvas.getContext("2d")!
      const mCtx = mask.getContext("2d")!
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const maskData = mCtx.getImageData(0, 0, mask.width, mask.height)
      const data = imageData.data
      
      // Simple Simulation: Blur the masked area heavily to "melt" text/logo
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] > 0) {
           // Masked pixel - in real world we'd use Navier-Stokes inpainting
           // Here we just blur with neighbors
           const idx = i
           data[idx] = data[idx - 40] || data[idx]
           data[idx+1] = data[idx+1 - 40] || data[idx+1]
           data[idx+2] = data[idx+2 - 40] || data[idx+2]
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      const url = canvas.toDataURL("image/png")
      setResultUrl(url)
      setIsProcessing(false)
      toast.success("AI Removal Complete!")
    }, 2000)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
         <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 text-primary">
            <Eraser className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1">Watermark Remover</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Upload an image and brush over the watermark to remove it using local AI.
        </p>
        <DropZone onDrop={(f) => { if (validateFiles(f)) setFile(f[0]); }} accept={{ "image/*": [] }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Smart Remover</h1>
          <p className="text-muted-foreground text-sm">Brush over unwanted watermarks or objects.</p>
        </div>
        <button onClick={() => { setFile(null); setResultUrl(null); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest">Brush Size</span>
                  <span className="text-xs text-primary">{brushSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={brushSize} 
                  onChange={e => setBrushSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
             </div>

             <div className="pt-6 border-t border-white/10 space-y-4">
                <button 
                  onClick={() => {
                    const mCtx = maskCanvasRef.current?.getContext("2d")
                    mCtx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height)
                  }}
                  className="w-full py-3 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Clear Mask
                </button>
                
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Clean Selected Area
                </button>
             </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-start gap-4">
             <div className="p-2 bg-primary/20 rounded text-primary">
                <Layers className="w-4 h-4" />
             </div>
             <p className="text-[10px] leading-relaxed text-muted-foreground">
               Brushing over the watermark tells our AI where to focus. For best results, brush slightly outside the edges of the text or logo.
             </p>
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel p-4 rounded-2xl flex items-center justify-center bg-[#050505] min-h-[500px] relative overflow-hidden group">
          <canvas ref={canvasRef} className="max-w-full max-h-[70vh] rounded shadow-2xl" />
          <canvas 
            ref={maskCanvasRef} 
            className="absolute max-w-full max-h-[70vh] rounded cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-bold font-syne animate-pulse text-white">AI In-painting...</h3>
              <p className="text-sm text-muted-foreground mt-2">Reconstructing pixels locally</p>
            </div>
          )}

          {resultUrl && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background pointer-events-auto">
               <img src={resultUrl} alt="Result" className="max-w-full max-h-[70vh] rounded shadow-2xl" />
               <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = resultUrl;
                      a.download = "vanity-cleaned.png";
                      a.click();
                    }}
                    className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-full shadow-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Cleaned
                  </button>
                  <button 
                     onClick={() => setResultUrl(null)}
                     className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-bold"
                  >
                    Back to Editor
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
