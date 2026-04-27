import React, { useState, useEffect, useMemo } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, Minimize2, CheckCircle, AlertTriangle, ShieldCheck, Info, Gauge, Zap, Layers, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { safeImport } from "@/lib/utils/loader"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { PillToggle } from "@/components/shared/PillToggle"
import { downloadBlob } from "@/lib/canvas/export"

export function CompressPdf() {
  const { validateFiles } = usePremium()
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single")
  
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [phase, setPhase] = useState("")
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  
  // Bulk state
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [bulkResults, setBulkResults] = useState<{file: File, blob: Blob}[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)

  // Metadata & Heuristics
  const [pageCount, setPageCount] = useState(0)
  const [isTextHeavy, setIsTextHeavy] = useState(false)
  
  // Modes & Settings
  const [mode, setMode] = useState<"smart" | "extreme">("smart")
  const [targetSizeKB, setTargetSizeKB] = useState(100)
  const PRESETS = [10, 50, 100, 200, 500]


  // Intelligence: Dynamic Calculations (Single Mode)
  const originalKB = useMemo(() => file ? (file.size / 1024) : 0, [file])
  const ratio = useMemo(() => targetSizeKB / originalKB, [targetSizeKB, originalKB])
  
  const absoluteMin = useMemo(() => pageCount * 8, [pageCount])
  const softFloor = useMemo(() => pageCount * 12, [pageCount])
  
  const bestPossible = useMemo(() => {
    const minPerPage = isTextHeavy ? 12 : 40
    const estimatedMin = pageCount * minPerPage
    return Math.max(estimatedMin, originalKB * 0.65)
  }, [pageCount, isTextHeavy, originalKB])

  const expectationRange = useMemo(() => {
    const variance = isTextHeavy ? 0.15 : 0.25
    return {
      min: Math.max(absoluteMin, targetSizeKB * (1 - variance)),
      max: targetSizeKB * (1 + variance)
    }
  }, [targetSizeKB, isTextHeavy, absoluteMin])

  // Handle Auto-Switch & Selection
  useEffect(() => {
    if (activeTab === "single" && file && isTextHeavy && ratio <= 0.6 && mode === "smart") {
      setMode("extreme")
    }
  }, [ratio, isTextHeavy, mode, file, activeTab])

  const handleDrop = async (files: File[]) => {
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
    setResultBlob(null)
    clearResultUrl()
    setPhase("Analyzing metadata...")
    
    try {
      const pdfjsLib = await safeImport(() => import("pdfjs-dist"), "PDF Engine")
      const pdfWorker = (await import("pdfjs-dist/build/pdf.worker?url")).default
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

      const arrayBuffer = await uploadedFile.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const count = pdf.numPages
      
      setPageCount(count)
      
      const textHeavy = (uploadedFile.size / count < 30 * 1024) && (uploadedFile.size < 500 * 1024)
      setIsTextHeavy(textHeavy)
      
      const initialTarget = Math.max(100, Math.floor((uploadedFile.size / 1024) * 0.75))
      setTargetSizeKB(initialTarget)
      
    } catch (e) {
      console.error(e)
      toast.error("Failed to analyze PDF")
    } finally {
      setPhase("")
    }
  }

  const runSmartCompress = async (fileToCompress: File, isBulk = false) => {
    setPhase("Optimizing PDF structure...")
    const { PDFDocument } = await import("pdf-lib")
    
    const arrayBuffer = await fileToCompress.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
    const result = new Blob([pdfBytes as any], { type: "application/pdf" })

    if (!isBulk && activeTab === "single" && result.size / 1024 > targetSizeKB + 50 && ratio < 0.8) {
      toast.info("Smart mode couldn't reach the target. Suggesting Extreme mode for better results.")
    }
    
    return result
  }

  const runExtremeCompress = async (fileToCompress: File, targetKB: number) => {
    const pdfjsLib = await safeImport(() => import("pdfjs-dist"), "PDF Engine")
    const pdfWorker = (await import("pdfjs-dist/build/pdf.worker?url")).default
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
    const { PDFDocument } = await import("pdf-lib")
    
    const arrayBuffer = await fileToCompress.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages = pdf.numPages

    const absMin = pages * 8
    if (targetKB < absMin) {
      throw new Error(`Target too low for ${fileToCompress.name}. Minimum possible is ~${Math.ceil(absMin)}KB.`)
    }

    const MAX_PIXELS = 10_000_000
    const MAX_ITERS = 10
    const targetBytes = targetKB * 1024
    
    let scale = 1.0
    let quality = 0.7
    let iteration = 0
    let finalBlobs: Blob[] = []

    while (iteration++ < MAX_ITERS) {
      setPhase(`Matching size (Attempt ${iteration}/${MAX_ITERS})...`)
      let currentTotalBytes = 0
      const currentBlobs: Blob[] = []
      
      const concurrency = 2
      for (let i = 1; i <= pages; i += concurrency) {
        setPhase(`Rendering (Page ${i}/${pages})...`)
        const chunk = Array.from({ length: Math.min(concurrency, pages - i + 1) }, (_, idx) => i + idx)
        
        const results = await Promise.all(chunk.map(async (pageNum) => {
          const page = await pdf.getPage(pageNum)
          let viewport = page.getViewport({ scale })
          
          if (viewport.width * viewport.height > MAX_PIXELS) {
            const safetyScale = Math.sqrt(MAX_PIXELS / (viewport.width * viewport.height))
            viewport = page.getViewport({ scale: scale * safetyScale })
          }

          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d")!
          
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
          
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", quality))
          
          canvas.width = 0
          canvas.height = 0
          return blob
        }))

        currentBlobs.push(...results)
        currentTotalBytes += results.reduce((acc, b) => acc + b.size, 0)
        setProgress(Math.round((i / pages) * 100))
      }

      const estimatedTotal = currentTotalBytes * 1.05
      if (estimatedTotal <= targetBytes || iteration === MAX_ITERS) {
        finalBlobs = currentBlobs
        break
      }

      if (scale > 0.5) scale -= 0.1
      else if (quality > 0.2) quality -= 0.1
      else {
        finalBlobs = currentBlobs
        break
      }
    }

    setPhase("Finalizing PDF...")
    const newPdf = await PDFDocument.create()
    for (const blob of finalBlobs) {
      const imgBytes = await blob.arrayBuffer()
      const image = await newPdf.embedJpg(imgBytes)
      const p = newPdf.addPage([image.width, image.height])
      p.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    }

    const bytes = await newPdf.save({ useObjectStreams: true })
    return new Blob([bytes as any], { type: "application/pdf" })
  }

  const handleProcessSingle = async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    setProgress(0)
    
    try {
      let result: Blob
      if (mode === "smart") {
        result = await runSmartCompress(file)
      } else {
        result = await runExtremeCompress(file, targetSizeKB)
      }
      
      setResultBlob(result)
      setResultUrl(result)
      toast.success("Compressed successfully!")
    } catch (error: any) {
      toast.error(error?.message || "Compression failed")
    } finally {
      setIsProcessing(false)
      setPhase("")
    }
  }

  const handleProcessBulk = async () => {
    if (bulkFiles.length === 0) return
    setIsBulkProcessing(true)
    setBulkProgress(0)
    setBulkResults([])
    const results: {file: File, blob: Blob}[] = []
    
    for (let i = 0; i < bulkFiles.length; i++) {
       const f = bulkFiles[i]
       try {
         let compressed: Blob
         if (mode === "smart") {
           compressed = await runSmartCompress(f, true)
         } else {
           compressed = await runExtremeCompress(f, targetSizeKB)
         }
         results.push({ file: f, blob: compressed })
         setBulkResults([...results])
         setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100))
       } catch (err: any) { 
         console.error(`Failed on ${f.name}`, err)
         toast.error(`Failed on ${f.name}: ${err.message || "Unknown error"}`)
       }
    }
    setIsBulkProcessing(false)
    setPhase("")
    toast.success("Bulk compression complete!")
  }

  const handleDownloadAllBulk = async () => {
    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      bulkResults.forEach(res => {
         zip.file(`compressed-${res.file.name}`, res.blob)
      })
      const content = await zip.generateAsync({ type: "blob" })
      downloadBlob(content, "vanity-compressed-pdfs.zip")
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
          { id: "single", label: "Single PDF", icon: Minimize2 },
          { id: "bulk", label: "Bulk PDF", icon: Layers }
        ]}
      />
    </div>
  )

  if (activeTab === "single" && !file) {
    return (
      <ToolUploadLayout title="Smart PDF Compressor" description="The most intelligent PDF optimizer. Analyzes content to choose the best strategy." icon={Minimize2} iconColor="accent">
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </ToolUploadLayout>
    )
  }

  if (activeTab === "bulk" && bulkFiles.length === 0) {
    return (
      <ToolUploadLayout title="Bulk PDF Compressor" description="Compress entire batches of PDF files locally and securely." icon={Layers} iconColor="accent">
        {renderTabSwitcher()}
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop multiple PDFs" multiple />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title={activeTab === "single" ? "Smart PDF Compressor" : "Bulk PDF Compressor"}
      description={activeTab === "single" ? (file ? `Optimizing: ${file.name}` : "The most intelligent PDF optimizer.") : `Batched: ${bulkFiles.length} files`}
      icon={activeTab === "single" ? Minimize2 : Layers}
      centered={true}
      maxWidth="max-w-7xl"
    >
      {activeTab === "single" && (
        <div className="mb-10 flex justify-center">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "single", label: "Single PDF", icon: Minimize2 },
              { id: "bulk", label: "Bulk PDF", icon: Layers }
            ]}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === "single" ? (
            <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden bg-black/20">
              {isProcessing && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-center p-12">
                  <Loader2 className="w-16 h-16 text-accent animate-spin mb-6" />
                  <h3 className="text-2xl font-bold font-syne text-white mb-2">{phase}</h3>
                  <div className="w-64 h-2 bg-white/10 rounded-full mt-4 overflow-hidden border border-white/5">
                     <div className="h-full bg-accent transition-all duration-300 shadow-[0_0_15px_rgba(252,211,77,0.5)]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-6 max-w-xs uppercase tracking-widest font-bold">Local Processing • Private</p>
                </div>
              )}

              {resultUrl && !isProcessing && (
                <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 w-full">
                  <div className="inline-flex items-center justify-center p-10 bg-accent/20 rounded-full text-accent shadow-[0_0_40px_rgba(252,211,77,0.2)]">
                     <CheckCircle className="w-24 h-24" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold font-syne mb-2">PDF Optimized!</h2>
                    {resultBlob && file && (
                      <div className="flex flex-col items-center gap-2 mt-4">
                        <p className="text-lg text-muted-foreground">
                          Reduced to <span className="text-accent font-bold">{(resultBlob.size / 1024).toFixed(1)} KB</span>
                        </p>
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                             -{Math.round((1 - resultBlob.size / file.size) * 100)}% Smallest
                           </span>
                           <span className="text-xs font-mono text-muted-foreground">Original: {originalKB.toFixed(1)} KB</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => {
                        if (!file) return;
                        const a = document.createElement("a"); a.href = resultUrl; a.download = `vanity-compressed-${file.name}`; a.click();
                      }}
                      className="px-10 py-5 text-xl font-bold bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-[0_0_40px_rgba(252,211,77,0.4)] transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                    >
                      <Download className="w-6 h-6" /> Export 
                    </button>
                    <button 
                      onClick={handleBack}
                      className="px-10 py-5 text-xl font-bold bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all flex items-center justify-center"
                    >
                      Start New
                    </button>
                  </div>
                </div>
              )}

              {!isProcessing && !resultUrl && (
                <div className="text-center space-y-8 max-w-md">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5 inline-block">
                      <Gauge className="w-16 h-16 text-accent/40" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-2xl font-bold font-syne">Ready to Optimize</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Select your target size. Our engine will choose between Structural (Smart) and Raster (Extreme) optimization for best results.
                      </p>
                   </div>
                   
                   {targetSizeKB < softFloor && targetSizeKB >= absoluteMin && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-bold animate-in shake duration-300">
                         <AlertTriangle className="w-5 h-5" />
                         Target too low. Minimum for this doc is {Math.ceil(absoluteMin)}KB.
                      </div>
                   )}
                   <div className="flex flex-col gap-4">
                     <button 
                       onClick={handleProcessSingle}
                       className="group px-12 py-5 bg-accent text-accent-foreground font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(252,211,77,0.2)] flex items-center justify-center gap-3"
                     >
                       <Zap className="w-5 h-5 fill-current" />
                       Compress Now
                     </button>
                     <button 
                       onClick={handleBack}
                       className="px-12 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full border border-white/10 transition-all text-sm"
                     >
                       Change File
                     </button>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col bg-black/40 rounded-3xl border border-white/5 overflow-hidden min-h-[440px]">
              {isBulkProcessing && (
                <div className="p-6 bg-accent/10 border-b border-accent/20 text-accent relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-accent/20 transition-all" style={{ width: `${bulkProgress}%` }} />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <div className="flex justify-between w-full text-[10px] font-bold">
                      <span>{phase || "COMPRESSING QUEUE..."}</span>
                      <span>{bulkResults.length} / {bulkFiles.length} DONE</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar max-h-[600px]">
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
                        <button onClick={() => downloadBlob(res.blob, `compressed-${res.file.name}`)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-[10px] rounded-lg transition-all uppercase">Download</button>
                      ) : !isBulkProcessing && (
                        <button onClick={() => removeBulkFile(f.name)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-4 space-y-6">
           {/* Expectation Box (Single Mode Only) */}
           {activeTab === "single" && (
             <div className="glass-panel p-6 rounded-xl space-y-4 border-accent/20 bg-accent/[0.02]">
                <h3 className="font-bold font-syne text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <Info className="w-4 h-4" /> Estimation & Impact
                </h3>
                
                <div className="space-y-4 py-2 border-y border-white/5">
                  <div className="flex justify-between items-end">
                     <div className="text-xs text-muted-foreground">Estimated Result</div>
                     <div className="text-lg font-bold font-mono text-white">~{expectationRange.min.toFixed(0)}–{expectationRange.max.toFixed(0)} <span className="text-xs font-normal">KB</span></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                     <div className="text-muted-foreground">Active Engine</div>
                     <div className={cn("px-2 py-0.5 rounded font-bold uppercase text-[10px]", 
                        mode === "extreme" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400")}>
                        {mode === "smart" ? "Smart (Text)" : "Extreme (Images)"}
                     </div>
                  </div>
                </div>

                <div className="space-y-3">
                   {ratio <= 0.6 && mode === "extreme" && (
                      <div className="flex gap-3 text-[11px] leading-relaxed text-red-400">
                         <AlertTriangle className="w-4 h-4 shrink-0" />
                         <span className="font-medium italic">Aggressive compression triggered. Output will be rasterized. Text will not be searchable.</span>
                      </div>
                   )}
                   {ratio > 0.6 && ratio <= 0.8 && (
                      <div className="flex gap-3 text-[11px] leading-relaxed text-yellow-400">
                         <AlertTriangle className="w-4 h-4 shrink-0" />
                         <span className="font-medium italic">Moderate target. Minor quality loss may be visible in images.</span>
                      </div>
                   )}
                   {isTextHeavy && ratio > 0.8 && (
                      <div className="flex gap-3 text-[11px] leading-relaxed text-blue-400">
                         <ShieldCheck className="w-4 h-4 shrink-0" />
                         <span className="font-medium italic">Perfectly safe. Your document is already highly optimized. Text quality preserved.</span>
                      </div>
                   )}
                </div>
             </div>
           )}

           {/* Mode Selection */}
           <div className="glass-panel p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold font-syne text-xs uppercase tracking-widest text-muted-foreground">Engine Mode</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMode("smart")}
                  disabled={activeTab === "single" && isTextHeavy && ratio < 0.6}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-bold transition-all relative overflow-hidden",
                    mode === "smart" ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-transparent hover:bg-white/10 opacity-50",
                    activeTab === "single" && isTextHeavy && ratio < 0.6 && "cursor-not-allowed grayscale"
                  )}
                >
                  Smart
                </button>
                <button 
                   onClick={() => setMode("extreme")}
                   className={cn(
                     "p-3 rounded-lg border text-xs font-bold transition-all",
                     mode === "extreme" ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-transparent hover:bg-white/10 opacity-50"
                   )}
                >
                  Extreme
                </button>
              </div>
              <div className="space-y-3 pt-2">
                 <div className="flex items-start gap-2 text-[10px]">
                    <div className="w-1 h-1 rounded-full bg-green-500 mt-1" />
                    <span className="text-muted-foreground"><span className="text-white font-medium">Smart:</span> Keeps text selectable. Best for documents.</span>
                 </div>
                 <div className="flex items-start gap-2 text-[10px]">
                    <div className="w-1 h-1 rounded-full bg-red-500 mt-1" />
                    <span className="text-muted-foreground"><span className="text-white font-medium">Extreme:</span> Maximum shrinkage. Pages → Images. Not searchable.</span>
                 </div>
              </div>
           </div>

           {/* Presets & Manual */}
           <div className="glass-panel p-6 rounded-xl space-y-6">
              <div>
                <div className="flex justify-between items-end mb-4">
                   <h3 className="font-bold font-syne text-xs uppercase tracking-widest text-muted-foreground">Configure Goal</h3>
                   <span className="text-xl font-bold font-mono text-accent">{targetSizeKB}KB</span>
                </div>
                
                <div className="grid grid-cols-5 gap-1.5">
                   {PRESETS.map((p: number) => (
                     <button 
                       key={p}
                       onClick={() => setTargetSizeKB(p)}
                       className={cn(
                         "py-2 rounded bg-white/5 border border-transparent text-[10px] font-bold hover:bg-white/10 transition-all",
                         targetSizeKB === p && "border-accent bg-accent/10 text-accent"
                       )}
                     >
                       {p}K
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                {activeTab === "single" && (
                  <button 
                     onClick={() => setTargetSizeKB(Math.ceil(bestPossible))}
                     className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-all text-muted-foreground hover:text-white flex items-center justify-center gap-2"
                  >
                    <Gauge className="w-3 h-3" /> Set Best Possible ({Math.ceil(bestPossible)}KB)
                  </button>
                )}
                <div className="relative">
                   <input 
                     type="number"
                     placeholder="Custom Target KB"
                     value={targetSizeKB}
                     onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                     className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-xs outline-none focus:border-accent/40 font-mono"
                   />
                </div>
              </div>

              {activeTab === "single" && targetSizeKB < softFloor && targetSizeKB >= absoluteMin && (
                 <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] leading-relaxed text-yellow-300 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>⚠️ Readability Risk: This target is very low. Output clarity may be significantly reduced.</span>
                 </div>
              )}
           </div>

           {/* Bulk Action Button in Sidebar */}
           {activeTab === "bulk" && (
             <div className="glass-panel p-6 rounded-xl space-y-4">
               {bulkResults.length > 0 && bulkResults.length === bulkFiles.length ? (
                 <button onClick={handleDownloadAllBulk} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95"><Download className="w-5 h-5" /> Export All ({bulkResults.length})</button>
               ) : (
                 <button onClick={handleProcessBulk} disabled={isBulkProcessing || bulkFiles.length === 0} className="w-full py-4 bg-accent text-accent-foreground font-bold rounded-xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 active:scale-95">
                   {isBulkProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Start Bulk Compress"}
                 </button>
               )}
               <button 
                 onClick={handleBack}
                 className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all text-xs"
               >
                 Clear Bulk Queue
               </button>
               <div className="h-24 border-2 border-dashed border-white/10 rounded-xl relative hover:border-accent/50 hover:bg-accent/5 transition-all text-center flex flex-col items-center justify-center cursor-pointer">
                 <input type="file" multiple accept="application/pdf" onChange={(e) => e.target.files && handleDrop(Array.from(e.target.files))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Add More Files</span>
               </div>
             </div>
           )}
        </div>
      </div>
    </ToolLayout>
  )
}
