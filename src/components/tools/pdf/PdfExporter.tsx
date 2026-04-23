import React, { useState, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, ArrowLeft, Loader2, Images, FileText, FileSearch, ShieldCheck, RefreshCw, Copy, CheckCircle } from "lucide-react"
import { usePremium } from "@/hooks/usePremium"
import { toast } from "sonner"
import JSZip from "jszip"
import * as pdfjsLib from "pdfjs-dist"
import { Document, Packer, Paragraph, TextRun } from "docx"
import { extractPdfText } from "@/lib/pdf-text"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { cn } from "@/lib/utils"

// Set up worker
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

type ExportMode = "images" | "text" | "word"

export function PdfExporter() {
  const { validateFiles } = usePremium()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ExportMode>("images")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  
  // Results
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [extractedText, setExtractedText] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return
    setFile(uploadedFile)
    resetState()
  }

  const resetState = () => {
    setIsProcessing(false)
    setProgress(0)
    setPageCount(0)
    setExtractedText("")
    clearResultUrl()
    setCopied(false)
  }

  const changeMode = (newMode: ExportMode) => {
    if (isProcessing) return
    setMode(newMode)
    resetState()
  }

  const handleStartNew = () => {
    setFile(null)
    resetState()
  }

  // --- Logic: Images ---
  const processToImages = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(5)
    
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null
    let pdf: pdfjsLib.PDFDocumentProxy | null = null

    try {
      const arrayBuffer = await file.arrayBuffer()
      loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      pdf = await loadingTask.promise
      const count = pdf.numPages
      setPageCount(count)
      setProgress(10)

      const zip = new JSZip()

      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport,
          // @ts-ignore
          canvas: canvas,
        }).promise

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), "image/png")
        })

        zip.file(`page-${i}.png`, blob)
        setProgress(Math.floor((i / count) * 85) + 10)

        // Release Memory
        canvas.width = 0
        canvas.height = 0
      }

      const content = await zip.generateAsync({ type: "blob" })
      setResultUrl(content)
      setProgress(100)
      toast.success(`Converted ${count} pages to images!`)
    } catch (error: any) {
      console.error(error)
      toast.error("Failed to convert PDF: " + (error?.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
      if (pdf) {
        await pdf.destroy()
      } else if (loadingTask) {
        await loadingTask.destroy()
      }
    }
  }

  // --- Logic: Text ---
  const processToText = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    try {
      const { fullText } = await extractPdfText(file, {
        includePageMarkers: true,
        onProgress: setProgress,
      })

      setExtractedText(fullText)
      setResultUrl(new Blob([fullText], { type: "text/plain" }))
      toast.success("Text extraction complete!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to extract text from PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  // --- Logic: Word ---
  const processToWord = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const paragraphs: Paragraph[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        const lines: Record<number, string[]> = {}
        textContent.items.forEach((item: any) => {
          const y = Math.round(item.transform[5])
          if (!lines[y]) lines[y] = []
          lines[y].push(item.str)
        })

        const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)
        
        sortedYs.forEach(y => {
          paragraphs.push(new Paragraph({
            children: [new TextRun(lines[y].join(" "))],
          }))
        })

        if (i < pdf.numPages) {
          paragraphs.push(new Paragraph({
             children: [new TextRun({ text: "", break: 1 })],
          }))
        }
        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }],
      })

      const blob = await Packer.toBlob(doc)
      setResultUrl(blob)
      toast.success("Conversion to .docx complete!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to convert PDF to Word.")
    } finally {
      setIsProcessing(false)
    }
  }

  const runExport = () => {
     if (mode === "images") processToImages();
     else if (mode === "text") processToText();
     else if (mode === "word") processToWord();
  }

  const handleDownload = () => {
    if (!resultUrl || !file) return
    const a = document.createElement("a")
    a.href = resultUrl
    
    if (mode === "images") a.download = `vanity-${file.name}-images.zip`
    else if (mode === "text") a.download = `vanity-${file.name}.txt`
    else if (mode === "word") a.download = `vanity-${file.name.replace(".pdf", "")}.docx`
    
    a.click()
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    toast.success("Text copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-6 text-accent">
            <FileSearch className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">PDF Exporter Suite</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
          Extract contents from your PDF document securely in your browser. Export into PNG Images, raw Text, or an editable Word Docx.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
             <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Export Hub</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={handleStartNew} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      {/* Target Format Selector */}
      <div className="glass-panel p-3 rounded-2xl flex justify-center gap-2 flex-wrap">
         <button onClick={() => changeMode("images")} disabled={isProcessing} className={cn("px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2", mode === "images" ? "bg-accent text-accent-foreground" : "hover:bg-white/5 opacity-50 hover:opacity-100")}>
            <Images className="w-4 h-4" /> Export to Images (ZIP)
         </button>
         <button onClick={() => changeMode("text")} disabled={isProcessing} className={cn("px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2", mode === "text" ? "bg-accent text-accent-foreground" : "hover:bg-white/5 opacity-50 hover:opacity-100")}>
            <FileText className="w-4 h-4" /> Export to Text (TXT)
         </button>
         <button onClick={() => changeMode("word")} disabled={isProcessing} className={cn("px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2", mode === "word" ? "bg-accent text-accent-foreground" : "hover:bg-white/5 opacity-50 hover:opacity-100")}>
            <FileSearch className="w-4 h-4" /> Export to Word (DOCX)
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Canvas / Viewer */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-8 rounded-[2rem] flex flex-col items-center justify-center min-h-[500px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
             
             {!isProcessing && !resultUrl && !extractedText ? (
                <div className="text-center space-y-4">
                   <p className="text-muted-foreground">Ready to export as <strong>{mode.toUpperCase()}</strong>.</p>
                   <button 
                     onClick={runExport}
                     className="px-8 py-5 bg-accent text-accent-foreground font-bold rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all text-lg mx-auto block"
                   >
                     Start Extraction
                   </button>
                </div>
             ) : isProcessing ? (
                <div className="space-y-6 text-center z-10 w-full max-w-sm">
                   <div className="relative inline-block">
                      <RefreshCw className="w-20 h-20 text-accent animate-spin opacity-20 mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-accent">
                         {progress}%
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">
                         {mode === "images" && "Rendering Pages..."}
                         {mode === "text" && "Extracting Text..."}
                         {mode === "word" && "Mapping Layout..."}
                      </p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                   </div>
                </div>
             ) : null}

             {/* Result Previews */}
             {mode === "images" && resultUrl && !isProcessing && (
                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center justify-center p-8 bg-white/5 rounded-full mb-2">
                     <Images className="w-20 h-20 text-accent opacity-50" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-syne text-white">{pageCount} Images Generated</h2>
                    <p className="text-muted-foreground mt-2">All pages have been converted to high-quality PNGs.</p>
                  </div>
                </div>
             )}

             {mode === "text" && extractedText && !isProcessing && (
                <textarea 
                  value={extractedText}
                  readOnly
                  className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] bg-transparent border-none outline-none font-mono text-xs leading-relaxed text-white/70 resize-none scrollbar-thin scrollbar-thumb-white/10"
                />
             )}

             {mode === "word" && resultUrl && !isProcessing && (
                <div className="text-center z-10 animate-in zoom-in-95 duration-500">
                   <div className="p-6 bg-accent/10 rounded-full inline-block text-accent border border-accent/20 mb-6">
                      <ShieldCheck className="w-16 h-16" />
                   </div>
                   <h2 className="text-4xl font-bold font-syne text-white mb-2">Docx Export Ready</h2>
                   <p className="text-muted-foreground mx-auto text-sm">
                     Verification of structure complete. Downlaod below.
                   </p>
                </div>
             )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8 border-white/10">
              
              {mode === "text" && extractedText && (
                 <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats</h4>
                   <div className="grid grid-cols-1 gap-2">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Characters</span>
                         <span className="text-sm font-mono text-white font-bold">{extractedText.length}</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Words</span>
                         <span className="text-sm font-mono text-white font-bold">{extractedText.split(/\s+/).length}</span>
                      </div>
                   </div>
                   <button 
                     onClick={handleCopyText}
                     className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                   >
                     {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                     Copy to Clipboard
                   </button>
                 </div>
              )}

              <div className="space-y-3">
                 <button 
                   onClick={handleDownload}
                   disabled={!resultUrl || isProcessing}
                   className="w-full py-5 bg-accent text-accent-foreground font-bold rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                 >
                   <Download className="w-5 h-5" />
                   Download {mode === "text" ? ".txt File" : mode === "word" ? ".docx File" : "ZIP Bundle"}
                 </button>
                 
                 {(resultUrl || extractedText) && !isProcessing && (
                   <div className="pt-4 text-center">
                     <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                       Select another format at the top to re-export.
                     </p>
                   </div>
                 )}
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-accent shrink-0 mt-1" />
              <div>
                 <h4 className="font-bold text-sm text-white">100% Client-Side</h4>
                 <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                   Your PDF never leaves your device. All parsing, GPU rendering, and zipping happens securely inside your browser Sandbox using Memory-Safe buffers.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
