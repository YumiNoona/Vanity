import React, { useState, useRef, useEffect } from "react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeftRight, Loader2, Layers, ArrowLeft, Info, Settings2, Image as ImageIcon, Trash2, CheckCircle } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { downloadBlob, canvasSupportsMime, exportCanvas } from "@/lib/canvas/export"
import { PillToggle } from "@/components/shared/PillToggle"

// Formats that use custom binary encoders (not canvas.toBlob) are always supported
const CUSTOM_ENCODER_FORMATS = new Set(["pdf", "svg", "ico"])

const FORMATS = [
  { id: "webp", label: "WebP", desc: "Modern, high compression" },
  { id: "png", label: "PNG", desc: "Lossless, supports transparency" },
  { id: "jpeg", label: "JPG", desc: "Universal, best for photos" },
  { id: "gif", label: "GIF", desc: "8-bit graphics & animation" },
  { id: "pdf", label: "PDF", desc: "Document for printing" },
  { id: "svg", label: "SVG", desc: "Scalable Vector (Raster Wrapped)" },
  { id: "ico", label: "ICO", desc: "Windows Icons & Favicons" },
  { id: "avif", label: "AVIF", desc: "Next-gen AV1 compression" },
]

const ICO_SIZES = [16, 32, 48, 64, 96, 128, 144, 180, 192, 256, 384, 512]

export function FormatConverter() {
  const { validateFiles } = usePremium()

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState("webp")
  const { isProcessing, processImage } = useImageProcessor()
  const [isEncoding, setIsEncoding] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [bulkResults, setBulkResults] = useState<{ file: File, blob: Blob }[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)

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
        header[entry + 1] = s >= 256 ? 0 : s
        dv.setUint16(entry + 4, 1, true)
        dv.setUint16(entry + 6, 32, true)
        dv.setUint32(entry + 8, icoPngs[i].length, true)
        dv.setUint32(entry + 12, offset, true)
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

    if (activeTab === "bulk") {
      const unique = files.filter(nf => !bulkFiles.some(existing => existing.name === nf.name))
      setBulkFiles(prev => [...prev, ...unique])
      setBulkResults([])
      setBulkProgress(0)
      return
    }

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
  }

  const processBulk = async () => {
    if (bulkFiles.length === 0) return
    setIsBulkProcessing(true)
    setBulkProgress(0)
    setBulkResults([])
    const results: { file: File, blob: Blob }[] = []

    for (let i = 0; i < bulkFiles.length; i++) {
      const f = bulkFiles[i]
      try {
        const blob = await runConversion(f, targetFormat)
        results.push({ file: f, blob })
        setBulkResults([...results])
        setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
      } catch (err) { console.error(`Failed on ${f.name}`, err) }
    }
    setIsBulkProcessing(false)
    toast.success("Bulk conversion complete!")
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = targetFormat === "ico" ? "favicons.zip" : `vanity-export.${targetFormat}`
    a.click()
  }

  const handleDownloadAllBulk = async () => {
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      bulkResults.forEach(res => {
        const outName = targetFormat === "ico" ? `${res.file.name.replace(/\.[^/.]+$/, "")}-favicons.zip` : `converted-${res.file.name.replace(/\.[^/.]+$/, `.${targetFormat}`)}`
        zip.file(outName, res.blob)
      })
      const content = await zip.generateAsync({ type: "blob" })
      downloadBlob(content, `vanity-converted-${targetFormat}.zip`)
    } catch (e) {
      toast.error("Failed to generate zip")
    }
  }

  const removeBulkFile = (name: string) => setBulkFiles(bulkFiles.filter(f => f.name !== name))

  const handleBack = () => {
    if (activeTab === "single") {
      setFile(null); clearResultUrl();
    } else {
      setBulkFiles([]); setBulkResults([]); setBulkProgress(0);
    }
  }

  const renderTabSwitcher = () => (
    <div className="mb-10 flex justify-center">
      <PillToggle
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        options={[
          { id: "single", label: "Single Convert", icon: ArrowLeftRight },
          { id: "bulk", label: "Bulk Convert", icon: Layers }
        ]}
      />
    </div>
  )

  if (activeTab === "single" && !file) {
    return (
      <ToolUploadLayout title="Image Converter" description="Professional-grade image transcoding between various formats." icon={ArrowLeftRight}>
        {renderTabSwitcher()}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6 mb-8">
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
                  <p className="text-[10px] text-muted-foreground leading-tight">{isUnsupported ? "Not supported in your browser" : f.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
        <DropZone onDrop={handleFiles} label="Drop image to convert" />
      </ToolUploadLayout>
    )
  }

  if (activeTab === "bulk" && bulkFiles.length === 0) {
    return (
      <ToolUploadLayout title="Bulk Image Converter" description="Convert entire batches of images locally and securely." icon={Layers}>
        {renderTabSwitcher()}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6 mb-8">
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
                  <p className="text-[10px] text-muted-foreground leading-tight">{isUnsupported ? "Not supported in your browser" : f.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
        <DropZone onDrop={handleFiles} accept={{ "image/*": [] }} label="Drop multiple images" multiple />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={activeTab === "single" ? "Image Converter" : "Bulk Convert"}
      description={activeTab === "single" ? `Editing: ${file?.name}` : `${bulkFiles.length} images queued`}
      icon={activeTab === "single" ? ArrowLeftRight : Layers}
      onBack={handleBack}
      backLabel="Start Over"
      maxWidth="max-w-6xl"
    >
      {activeTab === "single" ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">{file?.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Targeting {targetFormat.toUpperCase()}</p>
              </div>
            </div>
          </div>

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
                  <Download className="w-6 h-6" /> Export {targetFormat.toUpperCase()}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-8 rounded-3xl space-y-8 border-cyan-500/20 bg-black/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-4">
                <Settings2 className="w-4 h-4" /> Global Rules
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase">Target Format</label><span className="font-mono text-cyan-400 font-bold">{targetFormat.toUpperCase()}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => !unsupportedFormats.has(f.id) && setTargetFormat(f.id)}
                        disabled={unsupportedFormats.has(f.id)}
                        className={cn(
                          "py-2 px-1 text-center text-xs font-bold rounded-xl transition-all",
                          unsupportedFormats.has(f.id) ? "opacity-30" : targetFormat === f.id ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4">
                {bulkResults.length > 0 && bulkResults.length === bulkFiles.length ? (
                  <button onClick={handleDownloadAllBulk} className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95"><Download className="w-5 h-5" /> Export All ({bulkResults.length})</button>
                ) : (
                  <button onClick={processBulk} disabled={isBulkProcessing} className="w-full py-5 bg-cyan-500 text-black font-bold rounded-2xl shadow-xl hover:bg-cyan-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                    {isBulkProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Encoding...</> : "Start Bulk Convert"}
                  </button>
                )}
              </div>
            </div>
            <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl relative hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer">
              <input type="file" multiple accept="image/*" onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Add More Files</span>
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col bg-black/40 rounded-3xl border border-white/5 overflow-hidden min-h-[400px]">
            {isBulkProcessing && (
              <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-400 relative">
                <div className="absolute top-0 bottom-0 left-0 bg-cyan-500/20 transition-all" style={{ width: `${bulkProgress}%` }} />
                <div className="relative z-10 flex justify-between text-[10px] font-bold"><span>SEQUENTIAL QUEUE</span><span>{bulkResults.length} / {bulkFiles.length} DONE</span></div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[600px]">
              {bulkFiles.map((f, i) => {
                const res = bulkResults.find(p => p.file.name === f.name)
                return (
                  <div key={f.name} className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", res ? "bg-emerald-500/5 border-emerald-500/20 shadow-inner" : "bg-white/5 border-white/5")}>
                    <div className="flex items-center gap-4 flex-1 truncate pr-4">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">{res ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>}</div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-bold text-white truncate">{f.name}</span>
                        {res && <span className="text-[10px] text-emerald-400 font-mono">{(res.blob.size / 1024).toFixed(1)} KB</span>}
                      </div>
                    </div>
                    {res ? (
                      <button onClick={() => downloadBlob(res.blob, targetFormat === "ico" ? `${res.file.name.replace(/\.[^/.]+$/, "")}-favicons.zip` : `converted-${res.file.name.replace(/\.[^/.]+$/, `.${targetFormat}`)}`)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-[10px] rounded-lg transition-all uppercase">Download</button>
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
    </ToolLayout>
  )
}
