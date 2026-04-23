import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeftRight, Loader2, FileArchive, Layers, ArrowLeft, Info, CheckCircle, ChevronRight } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { drawToCanvas, exportCanvas } from "@/lib/canvas"
import { toast } from "sonner"
import { ModeToggle } from "@/components/shared/ModeToggle"
import { ProcessingQueue } from "@/components/shared/ProcessingQueue"
import type { QueueItem } from "@/types/bulk"
import { cn } from "@/lib/utils"
import { downloadBlob, canvasSupportsMime } from "@/lib/canvas/export"
// Removed static import for JSZip

// Formats that use custom binary encoders (not canvas.toBlob) are always supported
const CUSTOM_ENCODER_FORMATS = new Set(["pdf", "svg", "ico", "tga", "eps"])


const FORMATS = [
  { id: "webp", label: "WebP", desc: "Modern, high compression" },
  { id: "png", label: "PNG", desc: "Lossless, supports transparency" },
  { id: "jpeg", label: "JPG", desc: "Universal, best for photos" },
  { id: "gif", label: "GIF", desc: "8-bit graphics & animation" },
  { id: "pdf", label: "PDF", desc: "Document for printing" },
  { id: "svg", label: "SVG", desc: "Scalable Vector (Raster Wrapped)" },
  { id: "ico", label: "ICO", desc: "Windows Icons & Favicons" },
  { id: "avif", label: "AVIF", desc: "Next-gen AV1 compression" },
  { id: "bmp", label: "BMP", desc: "Uncompressed Windows bitmap" },
  { id: "tiff", label: "TIFF", desc: "Professional print format" },
  { id: "tga", label: "TGA", desc: "Targa Game Asset" },
  { id: "eps", label: "EPS", desc: "PostScript Vector Wrapper" },
]

const ICO_SIZES = [16, 32, 48, 64, 96, 128, 144, 180, 192, 256, 384, 512]

export function FormatConverter() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState("webp")
  const { isProcessing, processImage } = useImageProcessor()
  const [isEncoding, setIsEncoding] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Bulk State
  const [processMode, setProcessMode] = useState<'single' | 'batch'>('single')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  useEffect(() => {
    if (targetFormat === "ico" && processMode === "batch") {
      setProcessMode("single")
      setQueue([])
    }
  }, [targetFormat, processMode])

  // Detect browser support for canvas-based export formats
  const [unsupportedFormats, setUnsupportedFormats] = useState<Set<string>>(new Set())
  useEffect(() => {
    const unsupported = new Set<string>()
    for (const f of FORMATS) {
      if (CUSTOM_ENCODER_FORMATS.has(f.id)) continue // always supported
      const mime = `image/${f.id === "jpeg" ? "jpeg" : f.id}`
      if (!canvasSupportsMime(mime)) {
        unsupported.add(f.id)
      }
    }
    setUnsupportedFormats(unsupported)
  }, [])

  const preprocessIfHeic = async (sourceFile: File): Promise<File> => {
    if (sourceFile.name.toLowerCase().endsWith(".heic")) {
       const heic2any = (await import("heic2any")).default
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

  const runFaviconGeneration = async (uploadedFile: File) => {
    const preprocessedFile = await preprocessIfHeic(uploadedFile)
    const result = await processImage(preprocessedFile)
    if (!result) throw new Error("Processing failed")

    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      const makePngBlob = async (size: number) => {
        canvas.width = size
        canvas.height = size
        ctx.clearRect(0, 0, size, size)
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(result.source, 0, 0, size, size)
        return await new Promise<Blob>((resolve) => canvas.toBlob((bb) => resolve(bb!), "image/png"))
      }

      for (const size of ICO_SIZES) {
        const blob = await makePngBlob(size)
        zip.file(`favicon-${size}x${size}.png`, blob)
      }

      const icoSizes = [16, 32, 48]
      const icoPngs: Uint8Array[] = []
      for (const s of icoSizes) {
        const blob = await makePngBlob(s)
        icoPngs.push(new Uint8Array(await blob.arrayBuffer()))
      }
      
      // Basic ICO encoder
      const header = new Uint8Array(6 + 16 * icoSizes.length)
      const dv = new DataView(header.buffer)
      dv.setUint16(2, 1, true)
      dv.setUint16(4, icoSizes.length, true)
      
      let offset = header.length
      icoSizes.forEach((s, i) => {
        const entry = 6 + i * 16
        header[entry] = s >= 256 ? 0 : s
        header[entry+1] = s >= 256 ? 0 : s
        dv.setUint16(entry+4, 1, true)
        dv.setUint16(entry+6, 32, true)
        dv.setUint32(entry+8, icoPngs[i].length, true)
        dv.setUint32(entry+12, offset, true)
        offset += icoPngs[i].length
      })

      const finalIco = new Uint8Array(offset)
      finalIco.set(header)
      let currentOffset = header.length
      icoPngs.forEach(p => {
        finalIco.set(p, currentOffset)
        currentOffset += p.length
      })

      zip.file("favicon.ico", finalIco)
      const content = await zip.generateAsync({ type: "blob" })
      result.cleanup()
      return content
    } catch (err) {
      result.cleanup()
      throw err
    }
  }

  const runConversion = async (uploadedFile: File, target: string) => {
    if (target === "ico") return runFaviconGeneration(uploadedFile)

    const preprocessedFile = await preprocessIfHeic(uploadedFile)
    const result = await processImage(preprocessedFile)
    if (!result) throw new Error("Processing failed")

    try {
      const canvas = document.createElement("canvas")
      canvas.width = result.dimensions.width
      canvas.height = result.dimensions.height
      const ctx = canvas.getContext("2d")!
      
      // Draw source to canvas for compatibility (jspdf, toDataURL, etc.)
      if (target === "jpeg" || target === "jpg" || target === "bmp") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(result.source, 0, 0)

      if (target === "pdf") {
        const { jsPDF } = await import("jspdf")
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height]
        })
        // jsPDF v4 no longer accepts HTMLCanvasElement directly — must use data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
        pdf.addImage(dataUrl, "JPEG", 0, 0, canvas.width, canvas.height)
        const blob = pdf.output("blob")
        result.cleanup()
        return blob
      }

      if (target === "svg") {
        const dataUrl = canvas.toDataURL("image/png")
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
          <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />
        </svg>`
        const blob = new Blob([svgString], { type: "image/svg+xml" })
        result.cleanup()
        return blob
      }

      if (target === "tga") {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        
        const header = new Uint8Array(18)
        header[2] = 2 
        header[12] = canvas.width & 0xFF
        header[13] = (canvas.width >> 8) & 0xFF
        header[14] = canvas.height & 0xFF
        header[15] = (canvas.height >> 8) & 0xFF
        header[16] = 32 
        header[17] = 0x28 

        const tgaData = new Uint8Array(18 + pixels.length)
        tgaData.set(header)
        
        for (let i = 0; i < pixels.length; i += 4) {
          tgaData[18 + i] = pixels[i + 2]     // B
          tgaData[18 + i + 1] = pixels[i + 1] // G
          tgaData[18 + i + 2] = pixels[i]     // R
          tgaData[18 + i + 3] = pixels[i + 3] // A
        }
        
        const blob = new Blob([tgaData], { type: "image/x-tga" })
        result.cleanup()
        return blob
      }

      if (target === "eps") {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
        const base64 = dataUrl.split(",")[1]
        const epsString = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${canvas.width} ${canvas.height}
%%LanguageLevel: 2
%%Pages: 1
%%Page: 1 1
${canvas.width} ${canvas.height} scale
/DeviceRGB setcolorspace
{ << /ImageType 1 /Width ${canvas.width} /Height ${canvas.height} /BitsPerComponent 8 /Decode [0 1 0 1 0 1] /DataSource currentfile /ASCII85Decode filter /DCTDecode filter >> image } exec
${base64}
showpage
%%EOF`
        const blob = new Blob([epsString], { type: "application/postscript" })
        result.cleanup()
        return blob
      }

      const mimeType = `image/${target === "jpg" || target === "jpeg" ? "jpeg" : target}`
      const blob = await exportCanvas(canvas, mimeType, 0.92)
      result.cleanup()
      return blob
    } catch (err) {
      result.cleanup()
      throw err
    }
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0 || !validateFiles(files)) return

    if (processMode === 'single') {
      const uploadedFile = files[0]
      setFile(uploadedFile)
      clearResultUrl()
      try {
        setIsEncoding(true)
        const blob = await runConversion(uploadedFile, targetFormat)
        setResultUrl(blob)
        toast.success(`Converted to ${targetFormat.toUpperCase()}!`)
      } catch (error) {
        console.error("Conversion error:", error)
        toast.error("Conversion failed", {
          description: error instanceof Error ? error.message : "Unknown error — check browser console for details."
        })
      } finally {
        setIsEncoding(false)
      }
    } else {
      const newItems: QueueItem[] = files.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        status: 'pending',
        originalSize: f.size
      }))
      setQueue(prev => [...prev, ...newItems])
    }
  }

  const processBatch = useCallback(async () => {
    if (isBatchProcessing) return
    setIsBatchProcessing(true)
    const pending = queue.filter(i => i.status === 'pending')
    for (const item of pending) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q))
      try {
        const result = await runConversion(item.file, targetFormat)
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done', resultBlob: result, resultSize: result.size } : q))
      } catch (err) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed' } : q))
      }
    }
    setIsBatchProcessing(false)
  }, [isBatchProcessing, queue, targetFormat])

  useEffect(() => {
    if (processMode === 'batch' && !isBatchProcessing && queue.some(i => i.status === 'pending')) {
      processBatch()
    }
  }, [queue, processMode, isBatchProcessing, processBatch])

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = targetFormat === "ico" ? "favicons.zip" : `vanity-export.${targetFormat}`
    a.click()
  }

  return (
    <ToolLayout
      title="Image Converter"
      description="Professional-grade image transcoding between 12+ formats including WebP, AVIF, PDF, and HEIC inputs."
      icon={ArrowLeftRight}
    >
      <div className="space-y-8">
        {!file && queue.length === 0 ? (
          <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-center">
                <ModeToggle id="format" mode={processMode} onChange={setProcessMode} />
              </div>

             <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block text-center">Target Format</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {FORMATS.map(f => {
                     const isUnsupported = unsupportedFormats.has(f.id)
                     return (
                     <button
                       key={f.id}
                       onClick={() => !isUnsupported && setTargetFormat(f.id)}
                       disabled={isUnsupported}
                       className={cn(
                         "p-4 rounded-2xl border text-left transition-all group",
                         isUnsupported
                           ? "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                           : targetFormat === f.id ? "bg-primary/20 border-primary shadow-lg" : "bg-white/5 border-white/5 hover:bg-white/10"
                       )}
                     >
                        <p className={cn("text-xs font-black uppercase tracking-widest mb-1", isUnsupported ? "text-muted-foreground" : targetFormat === f.id ? "text-primary" : "text-white")}>{f.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {isUnsupported ? "Not supported in your browser" : f.desc}
                        </p>
                     </button>
                     )
                   })}
                </div>
             </div>

             <AnimatePresence mode="wait">
               <motion.div
                 key={processMode}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.3 }}
               >
                 <DropZone onDrop={handleFiles} multiple={processMode === 'batch'} label={processMode === 'batch' ? "Drop multiple images for batch conversion" : "Drop image to convert"} />
               </motion.div>
             </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary/20 rounded-lg text-primary">
                      <Layers className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold uppercase tracking-widest">
                         {processMode === 'batch' ? `${queue.length} Images` : file?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Targeting {targetFormat.toUpperCase()}</p>
                   </div>
                </div>
                <button onClick={() => { setFile(null); setQueue([]); clearResultUrl(); }} className="text-xs text-muted-foreground hover:text-white flex items-center gap-2">
                   <ArrowLeft className="w-3 h-3" /> Change
                </button>
             </div>

             {processMode === 'batch' ? (
                <div className="space-y-6">
                   <ProcessingQueue items={queue} onRemove={id => setQueue(q => q.filter(i => i.id !== id))} />
                   <div className="flex justify-center">
                      <button 
                        onClick={async () => {
                           const JSZip = (await import("jszip")).default
                           const zip = new JSZip()
                           queue.filter(i => i.resultBlob).forEach(i => zip.file(i.file.name.split(".")[0] + "." + targetFormat, i.resultBlob!))
                           const blob = await zip.generateAsync({ type: "blob" })
                           downloadBlob(blob, `vanity-batch-${targetFormat}.zip`)
                        }}
                        className="px-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-3"
                      >
                         <FileArchive className="w-6 h-6" /> Download Batch (ZIP)
                      </button>
                   </div>
                </div>
             ) : (
                <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[400px]">
                   {isProcessing || isEncoding ? (
                     <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Encoding...</p>
                     </div>
                   ) : resultUrl ? (
                     <div className="space-y-8 w-full flex flex-col items-center">
                        {targetFormat !== "ico" && <img src={resultUrl} className="max-h-[400px] rounded-xl shadow-2xl border border-white/5" />}
                        <button 
                           onClick={handleDownload}
                           className="px-10 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3"
                        >
                           <Download className="w-6 h-6" /> Download {targetFormat.toUpperCase()}
                        </button>
                     </div>
                   ) : null}
                </div>
             )}
          </div>
        )}

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
           <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
           <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-black">
             All processing is performed locally via the Web Image Decoding API and HTML5 Canvas. Your files are never uploaded to any server.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
