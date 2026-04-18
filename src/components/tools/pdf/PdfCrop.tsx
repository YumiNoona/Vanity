import React, { useState, useCallback, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Crop, Download, RefreshCw, FileText, CheckCircle, SlidersHorizontal, Loader2 } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Static worker import for pdfjs
import * as pdfjsLib from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

export function PdfCrop() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null)
  const [resultPdf, setResultPdf] = useState<Uint8Array | null>(null)
  
  // Interaction State
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeInteraction, setActiveInteraction] = useState<string | null>(null)
  const [startData, setStartData] = useState<{ x: number, y: number, margins: typeof margins } | null>(null)

  // Margins in points (1/72 inch)
  const [margins, setMargins] = useState({
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  })

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Mouse Interaction Handlers
  const handleInteractionStart = (e: React.MouseEvent, type: string) => {
    e.stopPropagation()
    e.preventDefault()
    setActiveInteraction(type)
    setStartData({
      x: e.clientX,
      y: e.clientY,
      margins: { ...margins }
    })
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!activeInteraction || !startData || !containerRef.current || !pageSize) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const deltaX_PX = e.clientX - startData.x
      const deltaY_PX = e.clientY - startData.y
      
      // Convert pixel delta to PDF points
      const deltaX_PT = (deltaX_PX / rect.width) * pageSize.width
      const deltaY_PT = (deltaY_PX / rect.height) * pageSize.height

      setMargins(prev => {
        let next = { ...startData.margins }
        
        if (activeInteraction === 'move') {
          // Move the entire box: shift left/right and top/bottom equally
          const horizShift = deltaX_PT
          const vertShift = deltaY_PT
          
          next.left = Math.max(0, Math.min(pageSize.width - prev.right - 10, startData.margins.left + horizShift))
          next.right = Math.max(0, Math.min(pageSize.width - next.left - 10, startData.margins.right - horizShift))
          
          next.top = Math.max(0, Math.min(pageSize.height - prev.bottom - 10, startData.margins.top + vertShift))
          next.bottom = Math.max(0, Math.min(pageSize.height - next.top - 10, startData.margins.bottom - vertShift))
        } else {
          // Individual handles
          if (activeInteraction.includes('n')) next.top = Math.max(0, Math.min(pageSize.height - next.bottom - 10, startData.margins.top + deltaY_PT))
          if (activeInteraction.includes('s')) next.bottom = Math.max(0, Math.min(pageSize.height - next.top - 10, startData.margins.bottom - deltaY_PT))
          if (activeInteraction.includes('w')) next.left = Math.max(0, Math.min(pageSize.width - next.right - 10, startData.margins.left + deltaX_PT))
          if (activeInteraction.includes('e')) next.right = Math.max(0, Math.min(pageSize.width - next.left - 10, startData.margins.right - deltaX_PT))
        }
        
        return next
      })
    }

    const handleUp = () => {
      setActiveInteraction(null)
      setStartData(null)
    }

    if (activeInteraction) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [activeInteraction, startData, pageSize])

  const renderPreview = async (file: File) => {
    setIsRendering(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.5 })
      
      // Store original size in points
      setPageSize({ width: viewport.width / 1.5, height: viewport.height / 1.5 })
      
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")!
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({ canvasContext: context, viewport }).promise
      
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"))
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      
      canvas.width = 0
      canvas.height = 0
    } catch (err) {
      console.error("Preview failed:", err)
    } finally {
      setIsRendering(false)
    }
  }

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      setResultPdf(null)
      renderPreview(uploadedFile)
    }
  }

  const cropPdf = useCallback(async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()

      for (const page of pages) {
        const { width, height } = page.getSize()
        
        // Define new crop box
        const newX = margins.left
        const newY = margins.bottom
        const newWidth = width - (margins.left + margins.right)
        const newHeight = height - (margins.top + margins.bottom)

        if (newWidth <= 0 || newHeight <= 0) {
          throw new Error("Margins are too large for this document's dimensions.")
        }

        page.setCropBox(newX, newY, newWidth, newHeight)
      }

      const savedPdf = await pdfDoc.save()
      setResultPdf(savedPdf)
      toast.success("Crop margins applied all pages!")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to crop PDF.")
    } finally {
      setIsProcessing(false)
    }
  }, [file, margins])

  const handleDownload = () => {
    if (!resultPdf) return
    const blob = new Blob([new Uint8Array(resultPdf)], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vanity-cropped-${file?.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-6 text-amber-500">
            <Crop className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Crop PDF</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Adjust page margins to remove whitespace or crop content.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to crop" />
      </div>
    )
  }

  // Calculate percentage-based overlay styles
  const overlayStyle = pageSize ? {
    top: `${(margins.top / pageSize.height) * 100}%`,
    bottom: `${(margins.bottom / pageSize.height) * 100}%`,
    left: `${(margins.left / pageSize.width) * 100}%`,
    right: `${(margins.right / pageSize.width) * 100}%`,
  } : { top: 0, bottom: 0, left: 0, right: 0 }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
             <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Cropping Engine</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setMargins({ top: 50, bottom: 50, left: 50, right: 50 })}
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> New File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
               <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">
                  <SlidersHorizontal className="w-3 h-3 text-amber-500" />
                  Margin Configuration (PT)
               </div>
               
               <div className="space-y-4">
                  {(["top", "right", "bottom", "left"] as const).map(side => (
                     <div key={side} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase pl-1">{side}</label>
                        <input 
                           type="number"
                           value={Math.round(margins[side])}
                           onChange={(e) => setMargins(prev => ({ ...prev, [side]: Math.max(0, parseInt(e.target.value) || 0) }))}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none transition-all"
                        />
                     </div>
                  ))}
               </div>

               <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                 Drag the handles on the preview to adjust margins visually. 72 points = 1 inch.
               </p>

               <button 
                  onClick={cropPdf}
                  disabled={isProcessing || isRendering}
                  className="w-full py-4 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
               >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Crop className="w-5 h-5" />}
                  Apply Crop to All Pages
               </button>
            </div>
         </div>

         <div className="lg:col-span-2">
            <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col items-center justify-center bg-black/40 border-white/5 shadow-2xl min-h-[500px] relative overflow-hidden">
               {isRendering && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4">
                     <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                     <p className="text-xs font-bold uppercase tracking-widest text-amber-500/80">Rendering Preview...</p>
                  </div>
               )}

               {resultPdf ? (
                  <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                     <div className="p-6 bg-emerald-500/10 rounded-full inline-block text-emerald-500 border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12" />
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-4xl font-bold font-syne text-white">Cropped & Ready</h2>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Margins have been adjusted</p>
                     </div>
                     <button 
                       onClick={handleDownload}
                       className="px-12 py-5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                     >
                       <Download className="w-6 h-6" />
                       Download Cropped PDF
                     </button>
                  </div>
               ) : previewUrl ? (
                  <div 
                    ref={containerRef}
                    className="relative group animate-in fade-in duration-700 select-none cursor-crosshair"
                  >
                     <img 
                        src={previewUrl} 
                        alt="Crop Preview" 
                        className="max-w-full max-h-[600px] rounded-lg shadow-2xl relative z-0 pointer-events-none" 
                     />
                     
                     {/* Visual Crop Mask */}
                     <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* Dimmed Areas */}
                        <div className="absolute bg-black/60 top-0 left-0 right-0 transition-all duration-300" style={{ height: overlayStyle.top }} />
                        <div className="absolute bg-black/60 bottom-0 left-0 right-0 transition-all duration-300" style={{ height: overlayStyle.bottom }} />
                        <div className="absolute bg-black/60 left-0 transition-all duration-300" 
                             style={{ 
                                top: overlayStyle.top, 
                                bottom: overlayStyle.bottom, 
                                width: overlayStyle.left 
                             } as any} />
                        <div className="absolute bg-black/60 right-0 transition-all duration-300" 
                             style={{ 
                                top: overlayStyle.top, 
                                bottom: overlayStyle.bottom, 
                                width: overlayStyle.right 
                             } as any} />

                        {/* Crop Box with Grid */}
                        <div 
                           onMouseDown={(e) => handleInteractionStart(e, 'move')}
                           className="absolute border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-150 cursor-move pointer-events-auto"
                           style={{
                              top: overlayStyle.top,
                              bottom: overlayStyle.bottom,
                              left: overlayStyle.left,
                              right: overlayStyle.right
                           }}
                        >
                           {/* Handles */}
                           <div onMouseDown={(e) => handleInteractionStart(e, 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white cursor-nw-resize z-20" />
                           <div onMouseDown={(e) => handleInteractionStart(e, 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white cursor-ne-resize z-20" />
                           <div onMouseDown={(e) => handleInteractionStart(e, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white cursor-sw-resize z-20" />
                           <div onMouseDown={(e) => handleInteractionStart(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full border border-white cursor-se-resize z-20" />
                           
                           <div onMouseDown={(e) => handleInteractionStart(e, 'n')} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-amber-500 cursor-n-resize rounded-full" />
                           <div onMouseDown={(e) => handleInteractionStart(e, 's')} className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-1 bg-amber-500 cursor-s-resize rounded-full" />
                           <div onMouseDown={(e) => handleInteractionStart(e, 'w')} className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 cursor-w-resize rounded-full" />
                           <div onMouseDown={(e) => handleInteractionStart(e, 'e')} className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 cursor-e-resize rounded-full" />

                           {/* 3x3 Grid Lines */}
                           <div className="absolute inset-x-0 top-1/3 h-px bg-amber-500/30" />
                           <div className="absolute inset-x-0 top-2/3 h-px bg-amber-500/30" />
                           <div className="absolute inset-y-0 left-1/3 w-px bg-amber-500/30" />
                           <div className="absolute inset-y-0 left-2/3 w-px bg-amber-500/30" />
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="text-center space-y-6">
                     <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20">
                        <FileText className="w-8 h-8" />
                     </div>
                     <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        Adjust the margins on the left. The crop is non-destructive (uses CropBox) and safe for all standard PDF readers.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
}
