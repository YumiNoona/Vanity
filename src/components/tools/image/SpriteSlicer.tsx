import React, { useState, useRef, useEffect, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Grid3X3, Download, RefreshCw, Scissors, AlertCircle, FileArchive } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
// JSZip is loaded dynamically in exportZip
import { guardDimensions, maybeYield } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useObjectUrl } from "@/hooks/useObjectUrl"

const MAX_PIXELS = 20_000_000 // Handled via guardDimensions

export function SpriteSlicer() {
  const [file, setFile] = useState<File | null>(null)
  const [imgData, setImgData] = useState<HTMLImageElement | null>(null)
  const [rows, setRows] = useState(4)
  const [cols, setCols] = useState(4)
  const [isProcessing, setIsProcessing] = useState(false)
  const { url: tilePreview, setUrl: setTilePreview, clear: clearTilePreview } = useObjectUrl()
  const { url: zipUrl, setUrl: setZipUrl, clear: clearZipUrl } = useObjectUrl()
  const [hasRemainder, setHasRemainder] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    
    setIsProcessing(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const { width, height } = guardDimensions(img.width, img.height)
          
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = width
          tempCanvas.height = height
          const ctx = tempCanvas.getContext("2d")
          if (ctx) {
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(img, 0, 0, width, height)
          }
          
          const scaledImg = new Image()
          scaledImg.onload = () => {
            setImgData(scaledImg)
            setFile(uploadedFile)
            setIsProcessing(false)
          }
          const dataUrl = tempCanvas.toDataURL()
          scaledImg.src = dataUrl
          
          // Cleanup temp
          tempCanvas.width = 0
          tempCanvas.height = 0
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(uploadedFile)
    } catch (err) {
      toast.error("Failed to load image")
      setIsProcessing(false)
    }
  }

  const updatePreview = useCallback(() => {
    if (!imgData) return
    
    const tileW = Math.floor(imgData.width / cols)
    const tileH = Math.floor(imgData.height / rows)
    
    setHasRemainder(imgData.width % cols !== 0 || imgData.height % rows !== 0)

    if (tileW <= 0 || tileH <= 0) return

    const canvas = document.createElement("canvas")
    canvas.width = tileW
    canvas.height = tileH
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(imgData, 0, 0, tileW, tileH, 0, 0, tileW, tileH)
    }
    canvas.toBlob((blob) => {
      if (blob) setTilePreview(blob)
      canvas.width = 0
      canvas.height = 0
    }, "image/png")
  }, [imgData, rows, cols, setTilePreview])

  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  // Draw Main Canvas & Overlay
  useEffect(() => {
    if (!imgData || !canvasRef.current || !overlayRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const maxWidth = 800
    const scale = Math.min(1, maxWidth / imgData.width)
    canvas.width = imgData.width * scale
    canvas.height = imgData.height * scale
    
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(imgData, 0, 0, canvas.width, canvas.height)

    const oCanvas = overlayRef.current
    oCanvas.width = canvas.width
    oCanvas.height = canvas.height
    const oCtx = oCanvas.getContext("2d")
    if (!oCtx) return

    oCtx.setLineDash([5, 5])
    oCtx.strokeStyle = "rgba(245, 158, 11, 0.8)"
    oCtx.lineWidth = 1

    const stepX = canvas.width / cols
    const stepY = canvas.height / rows

    for (let i = 1; i < cols; i++) {
       oCtx.beginPath()
       oCtx.moveTo(i * stepX, 0)
       oCtx.lineTo(i * stepX, canvas.height)
       oCtx.stroke()
    }
    for (let j = 1; j < rows; j++) {
       oCtx.beginPath()
       oCtx.moveTo(0, j * stepY)
       oCtx.lineTo(canvas.width, j * stepY)
       oCtx.stroke()
    }

  }, [imgData, rows, cols])

  const exportZip = async () => {
    if (!imgData) return
    setIsProcessing(true)
    
    try {
      const JSZipModule = await import("jszip")
      const JSZip = JSZipModule.default
      const zip = new JSZip()
      const tileW = Math.floor(imgData.width / cols)
      const tileH = Math.floor(imgData.height / rows)

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement("canvas")
          canvas.width = tileW
          canvas.height = tileH
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(imgData, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH)
          }
          
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"))
          if (blob) {
            zip.file(`sprite_row_${r+1}_col_${c+1}.png`, blob)
          }
          
          canvas.width = 0
          canvas.height = 0
          
          if (c % 5 === 0) await maybeYield()
        }
      }

      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })
      setZipUrl(content)
      toast.success("Sprite archive rendered!")
    } catch (err: any) {
      toast.error(err.message || "Failed to generate zip archive")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <ToolUploadLayout title="Sprite Slicer" description="Upload a sprite sheet to extract individual frames into a ZIP archive." icon={Scissors}>
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop sprite sheet here" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Slice Sheet" description="Define row/col grid and export all tiles." icon={Grid3X3} centered={true} maxWidth="max-w-7xl">

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="space-y-6">
           <div className="glass-panel p-6 rounded-2xl space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Grid3X3 className="w-3 h-3 text-primary" /> Grid Configuration
                 </label>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <span className="text-[10px] text-white/40 uppercase font-bold">Rows</span>
                       <input 
                         type="number" 
                         value={rows} 
                         onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                         className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] text-white/40 uppercase font-bold">Cols</span>
                       <input 
                         type="number" 
                         value={cols} 
                         onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                         className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none transition-all"
                       />
                    </div>
                 </div>
              </div>

              {tilePreview && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">First Tile Preview</span>
                      {hasRemainder && (
                         <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-1.5 animate-pulse">
                            <AlertCircle className="w-2.5 h-2.5 text-amber-500" />
                            <span className="text-[8px] font-bold text-amber-500 uppercase">Inexact Grid</span>
                         </div>
                      )}
                   </div>
                   <div className="aspect-square bg-black/40 rounded-xl border border-dashed border-white/10 flex items-center justify-center p-2 relative group overflow-hidden">
                      <img src={tilePreview} className="max-w-full max-h-full object-contain pixelated" alt="First Tile" />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                         <span className="text-[8px] font-bold text-white uppercase bg-black/60 px-2 py-1 rounded">Ref: (1, 1)</span>
                      </div>
                   </div>
                </div>
              )}

               {zipUrl ? (
                 <div className="space-y-4">
                    <a 
                      href={zipUrl} 
                      download={`vanity-spritesheet-${Date.now()}.zip`}
                      className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" /> Export Archive
                    </a>
                    <button 
                      onClick={exportZip}
                      disabled={isProcessing}
                      className="w-full text-xs font-bold text-muted-foreground hover:text-white transition-colors"
                    >
                      Re-generate with current grid
                    </button>
                 </div>
               ) : (
                 <button 
                   onClick={exportZip}
                   disabled={isProcessing}
                   className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
                   Slice & Export ZIP
                 </button>
               )}
           </div>
           
           <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase">
                 <AlertCircle className="w-3 h-3 text-primary" />
                 Local Processing
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Tiles are extracted as PNGs with transparency preserved. Filenames follow the <span className="text-primary font-mono opacity-100">row_{"{r}"}_col_{"{c}"}</span> pattern.
              </p>
           </div>
        </div>

        {/* Workspace */}
        <div className="xl:col-span-3 space-y-6">
           <div className="glass-panel p-8 rounded-3xl bg-[#050505] min-h-[500px] flex items-center justify-center overflow-auto shadow-inner relative group">
              <div className="relative">
                 <canvas ref={canvasRef} className="rounded-lg shadow-2xl shadow-primary/5" />
                 <canvas ref={overlayRef} className="absolute inset-0 rounded-lg pointer-events-none" />
              </div>
              
              <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {imgData?.width} x {imgData?.height} PX
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
