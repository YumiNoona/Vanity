import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Crop, RefreshCcw, Layers, Image as ImageIcon, Trash2, CheckCircle, Settings2 } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl, useObjectUrls } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { exportCanvas, downloadBlob } from "@/lib/canvas"
import { releaseCanvas } from "@/lib/canvas/guards"

interface ProcessedImage {
  originalFile: File
  originalWidth: number
  originalHeight: number
  resizedBlob: Blob
  newWidth: number
  newHeight: number
}

export function ImageCrop() {
  const { validateFiles } = usePremium()
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  
  // Single Mode State
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const { isProcessing: isSingleProcessing, processImage, getJobId, clearCurrent } = useImageProcessor()
  const { url: preview, setUrl: setPreview, clear: clearPreview } = useObjectUrl()
  const [sourceImage, setSourceImage] = useState<ImageBitmap | HTMLImageElement | null>(null)

  // Cleanup effect for sourceImage (ImageBitmap must be closed manually)
  useEffect(() => {
    return () => {
      if (sourceImage instanceof ImageBitmap) {
        sourceImage.close()
      }
    }
  }, [sourceImage])

  useEffect(() => {
    return () => {
      clearCurrent()
    }
  }, [clearCurrent])
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }) 
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })
  const [isExporting, setIsExporting] = useState(false)

  // Bulk Mode State
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const { urls: originalUrls, addUrl: addOriginalUrl, clear: clearOriginalUrls } = useObjectUrls()
  const { urls: resizedUrls, addUrl: addResizedUrl, clear: clearResizedUrls } = useObjectUrls()
  const [scaleMode, setScaleMode] = useState<"percentage" | "width" | "height">("width")
  const [scaleValue, setScaleValue] = useState<number>(800)
  const [quality, setQuality] = useState<number>(90)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [processedBulk, setProcessedBulk] = useState<ProcessedImage[]>([])

  /* --- Single Mode Logic --- */
  const handleSingleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    
    setSingleFile(uploadedFile)
    setPreview(uploadedFile) // Set preview immediately
    
    const result = await processImage(uploadedFile)
    if (!result) return
    setSourceImage(result.source)
  }

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (type === 'move') setIsDragging(true)
    else setIsResizing(type)
    
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = ((e.clientX - startPos.x) / rect.width) * 100
      const deltaY = ((e.clientY - startPos.y) / rect.height) * 100

      if (isDragging) {
        setCrop(prev => ({
          ...prev,
          x: Math.max(0, Math.min(100 - prev.width, startPos.cropX + deltaX)),
          y: Math.max(0, Math.min(100 - prev.height, startPos.cropY + deltaY))
        }))
      } else if (isResizing) {
        let newCrop = { ...crop }
        if (isResizing.includes('e')) newCrop.width = Math.max(5, Math.min(100 - startPos.cropX, startPos.cropW + deltaX))
        if (isResizing.includes('s')) newCrop.height = Math.max(5, Math.min(100 - startPos.cropY, startPos.cropH + deltaY))
        if (isResizing.includes('w')) {
          const maxWidth = startPos.cropX + startPos.cropW
          const newX = Math.max(0, Math.min(maxWidth - 5, startPos.cropX + deltaX))
          newCrop.x = newX
          newCrop.width = maxWidth - newX
        }
        if (isResizing.includes('n')) {
          const maxHeight = startPos.cropY + startPos.cropH
          const newY = Math.max(0, Math.min(maxHeight - 5, startPos.cropY + deltaY))
          newCrop.y = newY
          newCrop.height = maxHeight - newY
        }
        setCrop(newCrop)
      }
    }
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(null); }
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, startPos, crop])

  const handleSingleDownload = async () => {
    const imgElement = previewRef.current
    if (!imgElement) return

    setIsExporting(true)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    
    // Use the sourceImage if ready (better for high-res), otherwise fallback to the preview element
    const source = sourceImage || imgElement
    const w = (source as any).naturalWidth || (source as any).width
    const h = (source as any).naturalHeight || (source as any).height
    const realX = Math.floor((crop.x / 100) * w)
    const realY = Math.floor((crop.y / 100) * h)
    const realW = Math.floor((crop.width / 100) * w)
    const realH = Math.floor((crop.height / 100) * h)
    if (realW <= 0 || realH <= 0) {
      setIsExporting(false)
      return
    }
    canvas.width = realW
    canvas.height = realH
    await new Promise(requestAnimationFrame)
    ctx.drawImage(source, realX, realY, realW, realH, 0, 0, realW, realH)
    try {
      const blob = await exportCanvas(canvas, 'image/png', 1.0)
      downloadBlob(blob, `vanity-cropped-${singleFile?.name || "image.png"}`)
      toast.success("Image cropped successfully!")
      releaseCanvas(canvas)
    } catch (error) { 
      toast.error("Failed to generate image") 
    } finally {
      setIsExporting(false)
    }
  }

  /* --- Bulk Mode Logic --- */
  const handleBulkDrop = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const unique = newFiles.filter(nf => !bulkFiles.some(existing => existing.name === nf.name))
      setBulkFiles(prev => [...prev, ...unique])
      setProcessedBulk([])
      clearOriginalUrls()
      clearResizedUrls()
      setBulkProgress(0)
    }
  }

  const removeBulkFile = (name: string) => setBulkFiles(bulkFiles.filter(f => f.name !== name))

  const processBulkSequentially = async () => {
    if (bulkFiles.length === 0) return
    setIsBulkProcessing(true)
    setBulkProgress(0)
    setProcessedBulk([])
    clearResizedUrls()
    const results: ProcessedImage[] = []
    for (let i = 0; i < bulkFiles.length; i++) {
       const file = bulkFiles[i]
       try {
         const url = addOriginalUrl(file)
         const img = await new Promise<HTMLImageElement>((res, rej) => {
           const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url;
         })
         const canvas = document.createElement("canvas")
         let w = img.width, h = img.height
         if (scaleMode === "percentage") { const factor = scaleValue / 100; w *= factor; h *= factor; }
         else if (scaleMode === "width") { const factor = scaleValue / w; w = scaleValue; h *= factor; }
         else if (scaleMode === "height") { const factor = scaleValue / h; h = scaleValue; w *= factor; }
         canvas.width = Math.max(1, Math.round(w))
         canvas.height = Math.max(1, Math.round(h))
         const ctx = canvas.getContext("2d")!
         ctx.imageSmoothingEnabled = true
         ctx.imageSmoothingQuality = "high"
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
         await new Promise(r => setTimeout(r, 10))
         const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), file.type === "image/png" ? "image/png" : "image/jpeg", quality / 100))
         results.push({ originalFile: file, originalWidth: img.width, originalHeight: img.height, resizedBlob: blob, newWidth: canvas.width, newHeight: canvas.height })
         addResizedUrl(blob)
         setProcessedBulk([...results])
         setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
       } catch (err) { console.error(`Failed on ${file.name}`, err) }
    }
    setIsBulkProcessing(false)
  }

  const handleDownloadAllBulk = () => {
    processedBulk.forEach((item, i) => {
       setTimeout(() => {
          const a = document.createElement("a"); a.href = resizedUrls[i]; a.download = `resized-${item.originalFile.name}`; a.click();
       }, i * 300) 
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Universal Tab Switcher */}
      <div className="flex justify-center mb-4">
        <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 inline-flex shadow-2xl backdrop-blur-md">
          <button 
            onClick={() => setActiveTab("single")}
            className={cn(
              "px-10 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 min-w-[180px] justify-center",
              activeTab === "single" 
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            <Crop className="w-4 h-4" /> Single Crop
          </button>
          <button 
            onClick={() => setActiveTab("bulk")}
            className={cn(
              "px-10 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 min-w-[180px] justify-center",
              activeTab === "bulk" 
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            <Layers className="w-4 h-4" /> Bulk Resize
          </button>
        </div>
      </div>

      {activeTab === "single" ? (
        /* --- SINGLE CROP UI --- */
        <div className="space-y-8">
          {!singleFile ? (
            <div className="max-w-2xl mx-auto py-12 text-center">
              <h1 className="text-4xl font-bold font-syne mb-1">Image Crop</h1>
              <p className="text-muted-foreground text-lg mb-8">Precisely crop your images entirely in your browser.</p>
              <DropZone onDrop={handleSingleDrop} accept={{ "image/*": [] }} />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold font-syne mb-2">Crop Image</h1>
                  <p className="text-muted-foreground text-sm font-mono uppercase tracking-tighter">Adjust viewport to crop</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setCrop({ x: 10, y: 10, width: 80, height: 80 })} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                    <RefreshCcw className="w-4 h-4" /> Reset
                  </button>
                  <button onClick={() => { setSingleFile(null); clearPreview(); clearCurrent(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> New Image
                  </button>
                </div>
              </div>
              <div className="glass-panel p-8 rounded-3xl flex flex-col items-center overflow-hidden border-white/10 bg-black/40 min-h-[500px] justify-center">
                <div ref={containerRef} className="relative inline-flex max-w-full select-none rounded-xl overflow-hidden shadow-2xl bg-black/20">
                  {preview && (
                    <img 
                      ref={previewRef}
                      src={preview} 
                      alt="Preview" 
                      className="max-h-[60vh] w-auto object-contain pointer-events-none animate-in fade-in zoom-in duration-300" 
                    />
                  )}
                  <div 
                    className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] cursor-move transition-shadow"
                    style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                  >
                    {/* Handles */}
                    <div onMouseDown={(e) => handleMouseDown(e, 'nw')} className="absolute top-0 left-0 w-4 h-4 bg-primary -translate-x-1/2 -translate-y-1/2 cursor-nw-resize rounded-full border-2 border-white z-20" />
                    <div onMouseDown={(e) => handleMouseDown(e, 'ne')} className="absolute top-0 right-0 w-4 h-4 bg-primary translate-x-1/2 -translate-y-1/2 cursor-ne-resize rounded-full border-2 border-white z-20" />
                    <div onMouseDown={(e) => handleMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 bg-primary -translate-x-1/2 translate-y-1/2 cursor-sw-resize rounded-full border-2 border-white z-20" />
                    <div onMouseDown={(e) => handleMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 bg-primary translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border-2 border-white z-20" />
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                      <div className="border-r border-b border-white" /><div className="border-r border-b border-white" /><div className="border-b border-white" />
                      <div className="border-r border-b border-white" /><div className="border-r border-b border-white" /><div className="border-b border-white" />
                      <div className="border-r border-white" /><div className="border-r border-white" /><div />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-12 w-full mt-8 pt-6 border-t border-white/5">
                   <div className="space-y-1"><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Position</span><div className="text-sm font-mono text-white">X: {Math.round(crop.x)}% Y: {Math.round(crop.y)}%</div></div>
                   <div className="space-y-1"><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Size</span><div className="text-sm font-mono text-white">W: {Math.round(crop.width)}% H: {Math.round(crop.height)}%</div></div>
                </div>
                <button 
                  onClick={handleSingleDownload} 
                  disabled={isExporting} 
                  className="mt-8 px-12 py-5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center gap-3 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 shadow-lg"
                >
                  {isExporting ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6" />}
                  Download Cropped Result
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- BULK RESIZE UI --- */
        <div className="space-y-8">
          {bulkFiles.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 text-center">
              <h1 className="text-4xl font-bold font-syne mb-1">Bulk Image Resizer</h1>
              <p className="text-muted-foreground text-lg mb-8">Process entire batches of images locally and securely.</p>
              <DropZone onDrop={handleBulkDrop} accept={{ "image/*": [] }} label="Drop multiple images" multiple />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-8 rounded-3xl space-y-8 border-cyan-500/20 bg-black/40">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-4">
                    <Settings2 className="w-4 h-4" /> Global Rules
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Scaling Logic</label>
                      <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/10 rounded-xl p-1">
                        {["width", "height", "percentage"].map((m) => (
                          <button key={m} onClick={() => setScaleMode(m as any)} className={cn("px-2 py-2 text-[10px] font-bold transition-all rounded-lg uppercase tracking-tighter", scaleMode === m ? "bg-cyan-500 text-black shadow-lg" : "text-muted-foreground hover:text-white")}>{m}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase">{scaleMode === "percentage" ? "Percentage" : "Dimension (px)"}</label><span className="font-mono text-cyan-400 font-bold">{scaleValue}</span></div>
                      <input type="range" min={scaleMode === "percentage" ? 10 : 100} max={scaleMode === "percentage" ? 200 : 4000} value={scaleValue} onChange={(e) => setScaleValue(Number(e.target.value))} className="w-full accent-cyan-500" />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase">Quality</label><span className="font-mono text-emerald-400 font-bold">{quality}%</span></div>
                      <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-emerald-500" />
                    </div>
                  </div>
                  <div className="pt-4">
                    {processedBulk.length > 0 && processedBulk.length === bulkFiles.length ? (
                      <button onClick={handleDownloadAllBulk} className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Download All ({processedBulk.length})</button>
                    ) : (
                      <button onClick={processBulkSequentially} disabled={isBulkProcessing} className="w-full py-5 bg-cyan-500 text-black font-bold rounded-2xl shadow-xl hover:bg-cyan-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {isBulkProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Start Bulk Resize"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl relative hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer">
                  <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && handleBulkDrop(Array.from(e.target.files))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Add More Files</span>
                </div>
              </div>
              <div className="lg:col-span-8 flex flex-col bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
                {isBulkProcessing && (
                  <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-400 relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-cyan-500/20 transition-all" style={{ width: `${bulkProgress}%` }} />
                    <div className="relative z-10 flex justify-between text-[10px] font-bold"><span>SEQUENTIAL QUEUE</span><span>{processedBulk.length} / {bulkFiles.length} DONE</span></div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[600px]">
                  {bulkFiles.map((f, i) => {
                    const res = processedBulk.find(p => p.originalFile.name === f.name)
                    return (
                      <div key={f.name} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", res ? "bg-emerald-500/5 border-emerald-500/20 shadow-inner" : "bg-white/5 border-white/5")}>
                        <div className="flex items-center gap-4 flex-1 truncate pr-4">
                          <div className="w-8 h-8 flex items-center justify-center shrink-0">{res ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>}</div>
                          <div className="flex flex-col truncate"><span className="text-sm font-bold text-white truncate">{f.name}</span>{res && <span className="text-[10px] text-muted-foreground font-mono">{res.newWidth}×{res.newHeight}px</span>}</div>
                        </div>
                        {res ? (
                          <a href={resizedUrls[processedBulk.indexOf(res)]} download={`resized-${res.originalFile.name}`} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-[10px] rounded-lg transition-all uppercase">Download</a>
                        ) : !isBulkProcessing && (
                          <button onClick={() => removeBulkFile(f.name)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
