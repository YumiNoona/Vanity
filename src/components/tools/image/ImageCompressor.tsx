import React, { useState, useEffect } from "react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Minimize2, Loader2, Info, Layers, Gauge, Image as ImageIcon, Trash2, CheckCircle } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { downloadBlob } from "@/lib/canvas/export"
import { PillToggle } from "@/components/shared/PillToggle"

export function ImageCompressor() {
  const { validateFiles } = usePremium()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [bulkResults, setBulkResults] = useState<{ file: File, blob: Blob }[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)

  // Settings
  const [targetSizeKB, setTargetSizeKB] = useState(100)

  const loadImageFromFile = (input: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(input)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Failed to decode image"))
      }
      img.src = objectUrl
    })

  const runIterativeCompress = async (file: File, targetKB: number) => {
    const targetBytes = targetKB * 1024
    const MAX_ITERS = 8
    const img = await loadImageFromFile(file)

    let scale = 1.0
    let quality = 0.85
    let iteration = 0
    let lastBlob: Blob | null = null

    while (iteration++ < MAX_ITERS) {
      const canvas = document.createElement("canvas")
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext("2d")!
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality))
      lastBlob = blob

      // Cleanup canvas memory
      canvas.width = 0
      canvas.height = 0

      if (blob.size <= targetBytes) break

      if (quality > 0.4) quality -= 0.15
      else scale -= 0.15
    }
    return lastBlob!
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
    setIsProcessing(true)
    try {
      const compressed = await runIterativeCompress(uploadedFile, targetSizeKB)
      setResultBlob(compressed)
      setResultUrl(compressed)
      toast.success("Image compressed!")
    } catch (error) {
      toast.error("Compression failed")
    } finally {
      setIsProcessing(false)
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
        const compressed = await runIterativeCompress(f, targetSizeKB)
        results.push({ file: f, blob: compressed })
        setBulkResults([...results])
        setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
      } catch (err) { console.error(`Failed on ${f.name}`, err) }
    }
    setIsBulkProcessing(false)
    toast.success("Bulk compression complete!")
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-compressed-${file?.name || "image.jpg"}`)
  }

  const handleDownloadAllBulk = async () => {
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      bulkResults.forEach(res => {
        zip.file(`compressed-${res.file.name.replace(/\.[^/.]+$/, ".jpg")}`, res.blob)
      })
      const content = await zip.generateAsync({ type: "blob" })
      downloadBlob(content, "vanity-compressed-images.zip")
    } catch (e) {
      toast.error("Failed to generate zip")
    }
  }

  const removeBulkFile = (name: string) => setBulkFiles(bulkFiles.filter(f => f.name !== name))

  const handleBack = () => {
    if (activeTab === "single") {
      setFile(null); clearResultUrl(); setResultBlob(null);
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
          { id: "single", label: "Single Compress", icon: Minimize2 },
          { id: "bulk", label: "Bulk Compress", icon: Layers }
        ]}
      />
    </div>
  )

  if (activeTab === "single" && !file) {
    return (
      <ToolUploadLayout title="Image Compressor" description="Reduce file size while maintaining visual integrity via iterative smart encoding." icon={Minimize2}>
        {renderTabSwitcher()}
        <DropZone onDrop={handleFiles} label="Drop image to compress" />
      </ToolUploadLayout>
    )
  }

  if (activeTab === "bulk" && bulkFiles.length === 0) {
    return (
      <ToolUploadLayout title="Bulk Image Compressor" description="Compress entire batches of images locally and securely." icon={Layers}>
        {renderTabSwitcher()}
        <DropZone onDrop={handleFiles} accept={{ "image/*": [] }} label="Drop multiple images" multiple />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={activeTab === "single" ? "Image Compressor" : "Bulk Compress"}
      description={activeTab === "single" ? `Editing: ${file?.name}` : `${bulkFiles.length} images queued`}
      icon={activeTab === "single" ? Minimize2 : Layers}
      centered={true}
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
                <p className="text-[10px] text-muted-foreground uppercase">Targeting {targetSizeKB} KB</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[400px]">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Compressing...</p>
              </div>
            ) : resultUrl ? (
              <div className="space-y-8 w-full flex flex-col items-center">
                <img src={resultUrl} className="max-h-[400px] rounded-xl shadow-2xl border border-white/5" />
                <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Original</p>
                    <p className="text-lg font-mono font-bold text-white/50">{(file!.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-primary">Compressed</p>
                    <p className="text-lg font-mono font-bold text-white">{(resultBlob!.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-emerald-500">Savings</p>
                    <p className="text-lg font-mono font-bold text-emerald-500">{Math.round((1 - resultBlob!.size / file!.size) * 100)}%</p>
                  </div>
                </div>
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={handleDownload}
                    className="px-10 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3"
                  >
                    <Download className="w-6 h-6" /> Export
                  </button>
                  <button
                    onClick={handleBack}
                    className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all"
                  >
                    Start New
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-8 rounded-3xl space-y-8 border-cyan-500/20 bg-black/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-4">
                <Gauge className="w-4 h-4" /> Global Rules
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase">Target Size</label><span className="font-mono text-cyan-400 font-bold">{targetSizeKB} KB</span></div>
                  <input type="range" min="10" max="2000" step="10" value={targetSizeKB} onChange={(e) => setTargetSizeKB(Number(e.target.value))} className="w-full accent-cyan-500" />
                </div>
              </div>
              <div className="pt-4">
                {bulkResults.length > 0 && bulkResults.length === bulkFiles.length ? (
                  <button onClick={handleDownloadAllBulk} className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95"><Download className="w-5 h-5" /> Export All ({bulkResults.length})</button>
                ) : (
                  <button onClick={processBulk} disabled={isBulkProcessing} className="w-full py-5 bg-cyan-500 text-black font-bold rounded-2xl shadow-xl hover:bg-cyan-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                    {isBulkProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Start Bulk Compress"}
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
                        {res && <span className="text-[10px] text-emerald-400 font-mono">{(res.blob.size / 1024).toFixed(1)} KB (-{Math.round((1 - res.blob.size / f.size) * 100)}%)</span>}
                      </div>
                    </div>
                    {res ? (
                      <button onClick={() => downloadBlob(res.blob, `compressed-${res.file.name.replace(/\.[^/.]+$/, ".jpg")}`)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-[10px] rounded-lg transition-all uppercase">Download</button>
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
