import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, FileArchive, Layers } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { drawToCanvas, exportCanvas } from "@/lib/canvas"
import { toast } from "sonner"
import { ModeToggle } from "@/components/shared/ModeToggle"
import { ProcessingQueue } from "@/components/shared/ProcessingQueue"
import type { QueueItem } from "@/types/bulk"
import { cn } from "@/lib/utils"
import { downloadBlob } from "@/lib/canvas/export"
import JSZip from "jszip"
import heic2any from "heic2any"

const FORMATS = ["webp", "png", "jpeg", "gif", "ico"]
const ICO_SIZES = [16, 32, 48, 64, 96, 128, 144, 180, 192, 256, 384, 512]

export function FormatConverter() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState("webp")
  const { isProcessing, processImage } = useImageProcessor()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Bulk State
  const [processMode, setProcessMode] = useState<'single' | 'batch'>('single')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  // Ensure "ico" sets processMode to single
  useEffect(() => {
    if (targetFormat === "ico" && processMode === "batch") {
      setProcessMode("single")
      setQueue([])
    }
  }, [targetFormat, processMode])

  const preprocessIfHeic = async (sourceFile: File): Promise<File> => {
    if (sourceFile.name.toLowerCase().endsWith(".heic")) {
       const result = await heic2any({
         blob: sourceFile,
         toType: "image/jpeg",
         quality: 1,
       })
       const finalBlob = Array.isArray(result) ? result[0] : result;
       return new File([finalBlob], sourceFile.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" })
    }
    return sourceFile;
  }

  const makePngBlob = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: ImageBitmap | HTMLImageElement, size: number) => {
    canvas.width = size
    canvas.height = size
    ctx.clearRect(0, 0, size, size)
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, 0, 0, size, size)
    return await new Promise<Blob>((resolve) => canvas.toBlob((bb) => resolve(bb!), "image/png"))
  }

  const blobToU8 = async (b: Blob) => new Uint8Array(await b.arrayBuffer())

  const makeIcoFromPngs = (pngs: Uint8Array[], sizes: number[]) => {
    const count = pngs.length
    const headerSize = 6 + 16 * count
    const totalSize = headerSize + pngs.reduce((sum, p) => sum + p.length, 0)
    const out = new Uint8Array(totalSize)
    const dv = new DataView(out.buffer)

    dv.setUint16(0, 0, true) // reserved
    dv.setUint16(2, 1, true) // type = icon
    dv.setUint16(4, count, true) // count

    let dataOffset = headerSize
    for (let i = 0; i < count; i++) {
      const size = sizes[i]
      const png = pngs[i]
      const entryOffset = 6 + 16 * i
      out[entryOffset + 0] = size >= 256 ? 0 : size
      out[entryOffset + 1] = size >= 256 ? 0 : size
      out[entryOffset + 2] = 0
      out[entryOffset + 3] = 0
      dv.setUint16(entryOffset + 4, 1, true)
      dv.setUint16(entryOffset + 6, 32, true)
      dv.setUint32(entryOffset + 8, png.length, true)
      dv.setUint32(entryOffset + 12, dataOffset, true)
      out.set(png, dataOffset)
      dataOffset += png.length
    }
    return out
  }

  const runFaviconGeneration = async (uploadedFile: File) => {
    const preprocessedFile = await preprocessIfHeic(uploadedFile)
    const result = await processImage(preprocessedFile)
    if (!result) throw new Error("Processing failed")

    try {
      const zip = new JSZip()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      for (const size of ICO_SIZES) {
        const blob = await makePngBlob(canvas, ctx, result.source, size)
        zip.file(`favicon-${size}x${size}.png`, blob)
      }

      // Generate actual favicon.ico
      const icoSizes = [16, 32, 48]
      const icoPngs = await Promise.all(icoSizes.map(async (s) => blobToU8(await makePngBlob(canvas, ctx, result.source, s))))
      const icoBytes = makeIcoFromPngs(icoPngs, icoSizes)
      zip.file("favicon.ico", icoBytes)

      // Apple Touch Icon
      const appleBlob = await makePngBlob(canvas, ctx, result.source, 180)
      zip.file("apple-touch-icon.png", appleBlob)

      const content = await zip.generateAsync({ type: "blob" })
      result.cleanup()
      return content
    } catch (err) {
      result.cleanup()
      throw err
    }
  }

  const runConversion = async (uploadedFile: File, target: string) => {
    if (target === "ico") {
      return runFaviconGeneration(uploadedFile)
    }

    const preprocessedFile = await preprocessIfHeic(uploadedFile)
    const result = await processImage(preprocessedFile)
    if (!result) throw new Error("Processing failed")

    try {
      const canvas = canvasRef.current || document.createElement("canvas")
      const mimeType = `image/${target === "jpg" ? "jpeg" : target}`
      
      await drawToCanvas(result.source, canvas, {
        fillBackground: target === "jpeg" || target === "jpg" ? "#ffffff" : undefined,
        clear: true
      })
      
      const blob = await exportCanvas(canvas, mimeType, 0.95)
      result.cleanup()
      return blob
    } catch (err) {
      result.cleanup()
      throw err
    }
  }

  const handleConvert = async (files: File[]) => {
    if (files.length === 0) return
    if (!validateFiles(files)) return

    if (processMode === 'single') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      clearResultUrl()
      
      try {
        const blob = await runConversion(uploadedFile, targetFormat)
        setResultUrl(blob)
        toast.success(targetFormat === 'ico' ? `Favicon pack generated!` : `Converted to ${targetFormat.toUpperCase()}!`)
      } catch (error: any) {
        console.error(error)
        toast.error("Conversion failed")
      }
    } else {
      // Batch Mode (Not invoked if 'ico' selected)
      const newItems: QueueItem[] = files.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        status: 'pending',
        originalSize: f.size
      }))
      setQueue(prev => [...prev, ...newItems])
    }
  }

  const processBatch = async () => {
    if (isBatchProcessing || queue.filter(i => i.status === 'pending').length === 0) return
    
    setIsBatchProcessing(true)
    const pendingItems = queue.filter(i => i.status === 'pending')

    for (const item of pendingItems) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q))
      
      try {
        const result = await runConversion(item.file, targetFormat)
        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'done', 
          resultBlob: result, 
          resultSize: result.size 
        } : q))
      } catch (err) {
        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'failed', 
          errorMessage: "Failed to convert" 
        } : q))
      }
    }
    
    setIsBatchProcessing(false)
    toast.success("Batch conversion complete!")
  }

  useEffect(() => {
    if (processMode === 'batch' && !isBatchProcessing && queue.some(i => i.status === 'pending')) {
      processBatch()
    }
  }, [queue, processMode, isBatchProcessing])

  const handleDownloadZip = async () => {
    const doneItems = queue.filter(i => i.status === 'done' && i.resultBlob)
    if (doneItems.length === 0) return

    const zip = new JSZip()
    doneItems.forEach(item => {
      const name = item.file.name.replace(/\.[^/.]+$/, "") + `.${targetFormat}`
      zip.file(name, item.resultBlob!)
    })

    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, `vanity-batch-convert-${Date.now()}.zip`)
    toast.success(`Downloaded ${doneItems.length} images`)
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = targetFormat === "ico" 
      ? `vanity-favicons-${Date.now()}.zip` 
      : `vanity-converted.${targetFormat}`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        {targetFormat !== "ico" && (
          <ModeToggle mode={processMode} onChange={(m) => {
            setProcessMode(m)
            setFile(null)
            setQueue([])
            clearResultUrl()
          }} />
        )}

        <h1 className="text-4xl font-bold font-syne mb-1 mt-6">Image Converter</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Convert your images seamlessly between WEBP, PNG, JPG, GIF, SVG, and HEIC inputs natively.
        </p>
        
        <div className="glass-panel p-6 rounded-xl mb-8 flex flex-col items-center">
          <label className="text-sm font-bold mb-4 uppercase tracking-widest text-muted-foreground">Target Format</label>
          <div className="flex gap-2 flex-wrap justify-center">
            {FORMATS.map(f => (
              <button
                key={f}
                onClick={() => {
                   setTargetFormat(f)
                   // Restart batch if changing format
                   if (processMode === 'batch') {
                      setQueue(q => q.map(i => ({...i, status: 'pending', resultBlob: undefined, resultSize: undefined})))
                   }
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                  targetFormat === f 
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                    : "bg-white/5 border-transparent hover:bg-white/10"
                )}
              >
                {f === "ico" ? "Favicon Pack (ZIP)" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {processMode === 'batch' && queue.length > 0 ? (
          <div className="space-y-8 animate-in fade-in duration-500">
             <ProcessingQueue 
               items={queue} 
               onRemove={(id) => setQueue(prev => prev.filter(i => i.id !== id))}
               disabled={isBatchProcessing}
             />
             
             <div className="flex justify-center gap-4">
                <button 
                  onClick={handleDownloadZip}
                  disabled={queue.filter(i => i.status === 'done').length === 0}
                  className="px-8 py-4 text-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <FileArchive className="w-6 h-6" /> 
                  Download ZIP ({queue.filter(i => i.status === 'done').length})
                </button>
                <div className="relative overflow-hidden inline-flex items-center justify-center">
                   <input 
                      type="file" multiple accept="image/*,.heic,.svg" 
                      onChange={(e) => e.target.files && handleConvert(Array.from(e.target.files))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   />
                   <button className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 rounded-full transition-all flex items-center gap-3">
                      Add More Files
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <DropZone 
            onDrop={handleConvert} 
            accept={{ "image/*": [], "image/svg+xml": [], "image/heic": [] }} 
            multiple={processMode === 'batch' && targetFormat !== "ico"}
            label={processMode === 'batch' ? "Drop multiple images (including SVG/HEIC) for conversion" : "Drop image to convert"}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">Image Converter</h1>
          <p className="text-muted-foreground text-sm">Target: {targetFormat === "ico" ? "Favicon Pack" : targetFormat.toUpperCase()}</p>
        </div>
        <button 
          onClick={() => { setFile(null); clearResultUrl(); }} 
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">Converting...</h3>
          </div>
        )}

        {resultUrl && !isProcessing && (
          <div className="text-center">
            {targetFormat === "ico" ? (
               <div className="flex flex-col items-center gap-4 text-emerald-500">
                  <Layers className="w-20 h-20 opacity-50 mx-auto" />
                  <p className="text-lg font-bold font-syne text-white">Favicon Pack successfully bundled</p>
               </div>
            ) : (
               <img src={resultUrl} alt="Result" className="max-h-[450px] object-contain shadow-2xl rounded-lg mx-auto" />
            )}
          </div>
        )}
      </div>

      {resultUrl && !isProcessing && (
        <div className="flex justify-center">
          <button 
            onClick={handleDownload}
            className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105"
          >
            <Download className="w-6 h-6" /> Download {targetFormat === "ico" ? "ZIP" : targetFormat.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  )
}
