import React, { useState, useCallback, useEffect, useMemo } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { 
  ArrowLeft, Layout, Download, RefreshCw, FileText, CheckCircle, 
  Settings2, Smartphone, Monitor, Maximize2, AlertCircle, Info,
  ChevronRight, List
} from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { PDFDocument, rgb } from "pdf-lib"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { toBlob } from "@/lib/utils/blob"
import { useObjectUrl } from "@/hooks/useObjectUrl"

const SHEET_SIZES = {
  A4: { width: 595, height: 842 },
  Letter: { width: 612, height: 792 },
  A3: { width: 842, height: 1191 },
  Tabloid: { width: 792, height: 1224 }
}

const NUP_CONFIGS: Record<number, { cols: number; rows: number }> = {
  2: { cols: 2, rows: 1 },
  4: { cols: 2, rows: 2 },
  6: { cols: 3, rows: 2 },
  9: { cols: 3, rows: 3 },
  12: { cols: 4, rows: 3 },
  16: { cols: 4, rows: 4 }
}

/**
 * Parses page range strings like "1-3, 5, 8-10"
 * Returns 0-indexed page numbers
 */
function parsePageRange(range: string, maxPages: number): number[] {
  if (!range || range.trim() === "") {
    return Array.from({ length: maxPages }, (_, i) => i)
  }

  const result: number[] = []
  const parts = range.split(",").map(p => p.trim())

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(v => parseInt(v.trim()))
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          result.push(i - 1)
        }
      }
    } else {
      const page = parseInt(part)
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        result.push(page - 1)
      }
    }
  }

  return [...new Set(result)].sort((a, b) => a - b)
}

export function PdfNup() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" })
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  // Configuration
  const [nup, setNup] = useState(4)
  const [sheetSize, setSheetSize] = useState<keyof typeof SHEET_SIZES>("A4")
  const [isLandscape, setIsLandscape] = useState(false)
  const [fitMode, setFitMode] = useState<"fit" | "fill">("fit")
  const [margins, setMargins] = useState(20)
  const [gutters, setGutters] = useState(10)
  const [pageRange, setPageRange] = useState("")

  const handleDrop = useCallback(async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setResultUrl(null)
    }
  }, [])

  const runImposition = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress({ current: 0, total: 0, status: "Initializing PDF engine..." })

    try {
      const arrayBuffer = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(arrayBuffer)
      const totalSrcPages = srcDoc.getPageCount()

      if (totalSrcPages > 300) {
        toast.warning("Large document detected. Processing may take a moment.")
      }

      // Parse range
      const targetIndices = parsePageRange(pageRange, totalSrcPages)
      const count = targetIndices.length

      if (count === 0) throw new Error("No pages selected in range.")

      // Setup output doc
      const outDoc = await PDFDocument.create()
      const sheetDim = SHEET_SIZES[sheetSize]
      const outWidth = isLandscape ? sheetDim.height : sheetDim.width
      const outHeight = isLandscape ? sheetDim.width : sheetDim.height

      const { cols, rows } = NUP_CONFIGS[nup]
      const usableWidth = outWidth - margins * 2
      const usableHeight = outHeight - margins * 2
      const cellWidth = (usableWidth - (cols - 1) * gutters) / cols
      const cellHeight = (usableHeight - (rows - 1) * gutters) / rows

      const pagesPerSheet = nup
      const totalSheets = Math.ceil(count / pagesPerSheet)

      setProgress({ current: 0, total: totalSheets, status: `Starting imposition for ${count} pages...` })

      for (let s = 0; s < totalSheets; s++) {
        const sheet = outDoc.addPage([outWidth, outHeight])
        
        for (let i = 0; i < pagesPerSheet; i++) {
          const pageIdx = s * pagesPerSheet + i
          const col = i % cols
          const row = Math.floor(i / cols)

          const cellX = margins + col * (cellWidth + gutters)
          const cellY = outHeight - margins - (row + 1) * cellHeight - row * gutters

          if (pageIdx < count) {
            const actualPageIdx = targetIndices[pageIdx]
            
            // Chunking: Use requestAnimationFrame every 4 sub-pages to keep UI alive
            if (pageIdx % 4 === 0) {
              await new Promise(requestAnimationFrame)
              setProgress({ 
                current: s + 1, 
                total: totalSheets, 
                status: `Processing sheet ${s + 1} of ${totalSheets} (Page ${pageIdx + 1}/${count})...` 
              })
            }

            // High compatibility: Embed page individually to handle mixed sizes
            const [embedded] = await outDoc.embedPages([srcDoc.getPage(actualPageIdx)])
            const { width: pW, height: pH } = embedded

            const scale = fitMode === "fit" 
              ? Math.min(cellWidth / pW, cellHeight / pH)
              : Math.max(cellWidth / pW, cellHeight / pH)

            const xOffset = (cellWidth - pW * scale) / 2
            const yOffset = (cellHeight - pH * scale) / 2

            sheet.drawPage(embedded, {
              x: cellX + xOffset,
              y: cellY + yOffset,
              width: pW * scale,
              height: pH * scale,
              // Clipping for Fill mode
              ...(fitMode === "fill" && {
                clip: { 
                  x: 0, 
                  y: 0, 
                  width: cellWidth / scale, 
                  height: cellHeight / scale 
                }
              })
            })
          } else {
            // Draw placeholder for blank cells
            sheet.drawRectangle({
              x: cellX,
              y: cellY,
              width: cellWidth,
              height: cellHeight,
              color: rgb(0.5, 0.5, 0.5),
              opacity: 0.05
            })
          }
        }
      }

      const outBytes = await outDoc.save()
      const blob = toBlob(outBytes, "application/pdf")
      setResultUrl(blob)
      toast.success("PDF Imposition complete!")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to process PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-nup-${nup}-${file?.name}`
    a.click()
  }

  // Visual Grid Preview (SVG-based)
  const gridPreview = useMemo(() => {
    const { cols, rows } = NUP_CONFIGS[nup]
    return (
      <div className="relative w-full aspect-[1/1.4] bg-white/5 rounded-xl border border-white/5 overflow-hidden p-6">
        <div className={cn(
          "bg-white transition-all duration-300 mx-auto shadow-2xl relative",
          isLandscape ? "aspect-[1.4/1] w-full" : "aspect-[1/1.4] h-full"
        )}>
           <div 
             className="absolute border border-black/5 grid gap-1 p-1 bg-black/5"
             style={{
               inset: `${margins / 2}%`, // Simplified scaling for preview
               gridTemplateColumns: `repeat(${cols}, 1fr)`,
               gridTemplateRows: `repeat(${rows}, 1fr)`,
               gap: `${gutters / 4}px`
             }}
           >
              {Array.from({ length: nup }).map((_, i) => (
                <div key={i} className="bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[8px] font-bold text-amber-600/60 uppercase">
                  p{i + 1}
                </div>
              ))}
           </div>
        </div>
      </div>
    )
  }, [nup, isLandscape, margins, gutters])

  if (!file) {
    return (
      <ToolUploadLayout title="N-up Imposition" description="Arrange multiple pages per sheet for efficient printing." icon={Layout}>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to impose" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout title="Imposition Engine" description={file.name} icon={FileText} onBack={() => { setFile(null); clearResultUrl(); }} backLabel="Change File" maxWidth="max-w-6xl">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Sidebar Controls */}
         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
               <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">
                  <Settings2 className="w-3 h-3 text-indigo-500" />
                  Layout Configuration
               </div>

               {/* N-up Select */}
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase pl-1">Grid Size (N-up)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 4, 6, 9, 12, 16].map(val => (
                      <button 
                        key={val}
                        onClick={() => setNup(val)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold transition-all border",
                          nup === val ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {val}-up
                      </button>
                    ))}
                  </div>
               </div>

               {/* Fit Mode */}
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase pl-1">Page Fitting</label>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    <button 
                      onClick={() => setFitMode("fit")}
                      className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", fitMode === "fit" ? "bg-white/10 text-white shadow-lg" : "text-white/30")}
                    >Fit</button>
                    <button 
                      onClick={() => setFitMode("fill")}
                      className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", fitMode === "fill" ? "bg-white/10 text-white shadow-lg" : "text-white/30")}
                    >Fill</button>
                  </div>
               </div>

               {/* Sheet Size */}
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase pl-1">Sheet Format</label>
                  <select 
                    value={sheetSize}
                    onChange={(e) => setSheetSize(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none appearance-none"
                  >
                    {Object.keys(SHEET_SIZES).map(s => <option key={s} value={s}>{s} Sheet</option>)}
                  </select>
               </div>

               {/* Orientation */}
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                     {isLandscape ? <Maximize2 className="w-4 h-4 text-indigo-500 rotate-90" /> : <Maximize2 className="w-4 h-4 text-indigo-500" />}
                     <span className="text-xs font-bold text-white">Landscape</span>
                  </div>
                  <button 
                    onClick={() => setIsLandscape(!isLandscape)}
                    className={cn("w-10 h-5 rounded-full transition-all relative", isLandscape ? "bg-indigo-500" : "bg-white/10")}
                  >
                     <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", isLandscape ? "right-1" : "left-1")} />
                  </button>
               </div>

               {/* Page Range */}
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase pl-1 flex items-center justify-between">
                     Page Range
                     <span className="normal-case font-medium opacity-50">e.g. 1-10, 15</span>
                  </label>
                  <div className="relative">
                    <List className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <input 
                      type="text"
                      placeholder="All Pages"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-indigo-500/50 outline-none transition-all"
                    />
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                 {resultUrl ? (
                    <button 
                      onClick={handleDownload}
                      className="w-full py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-6 h-6" /> Export
                    </button>
                 ) : (
                    <button 
                      onClick={runImposition}
                      disabled={isProcessing}
                      className="w-full py-5 bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
                    >
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Layout className="w-6 h-6" />}
                      Generate Layout
                    </button>
                 )}
               </div>
            </div>

            {/* Hint Box */}
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2">
               <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase">
                  <Info className="w-3 h-3" />
                  Print Pro Tip
               </div>
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                  For mixed portrait and landscape source files, <strong>"Fit"</strong> mode ensures every page is fully visible. 
                  <strong> "Fill"</strong> mode is better for uniform documents to maximize readabilty.
               </p>
            </div>
         </div>

         {/* Visual Preview Area */}
         <div className="lg:col-span-8 flex flex-col items-center">
            {isProcessing ? (
               <div className="w-full glass-panel p-20 rounded-[2.5rem] bg-black/40 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
                  <div className="relative">
                     <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                     <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                        {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-xl font-bold font-syne text-white tracking-widest uppercase">Imposing Layout...</h3>
                     <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em]">{progress.status}</p>
                  </div>
                  <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-indigo-500 transition-all duration-500" 
                        style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                     />
                  </div>
               </div>
            ) : resultUrl ? (
               <div className="w-full glass-panel p-20 rounded-[2.5rem] bg-black/40 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px] animate-in zoom-in-95 duration-700">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                     <CheckCircle className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold font-syne text-white uppercase tracking-tighter italic">Sheet Processing Ready</h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">N-up imposition complete for {file.name}</p>
                  </div>
                  <button 
                    onClick={handleDownload}
                    className="px-12 py-5 bg-white text-black font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Download className="w-6 h-6" /> Export </button>
               </div>
            ) : (
               <div className="w-full space-y-8 animate-in fade-in duration-1000">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                     <span>Layout Preview</span>
                     <span>Target: {sheetSize} {isLandscape ? 'Landscape' : 'Portrait'}</span>
                  </div>
                  
                  {gridPreview}

                  <div className="grid grid-cols-2 gap-4">
                     <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-white/5">
                        <div className="p-3 bg-white/5 rounded-xl text-indigo-500">
                           <Layout className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-white/40 uppercase">Layout Indexing</p>
                           <p className="text-sm font-bold text-white">Side-by-side Z-pattern</p>
                        </div>
                     </div>
                     <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-white/5">
                        <div className="p-3 bg-white/5 rounded-xl text-indigo-500">
                           <Maximize2 className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-white/40 uppercase">Scaling Method</p>
                           <p className="text-sm font-bold text-white">{fitMode === 'fit' ? 'Proportional Fit' : 'Cover Cell (Fill)'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </ToolLayout>
  )
}
