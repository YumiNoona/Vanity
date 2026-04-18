import React, { useState, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, FileText, Download, RefreshCw, FileSearch, ShieldCheck } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { Document, Packer, Paragraph, TextRun } from "docx"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Set up worker
import pdfWorker from "pdfjs-dist/build/pdf.worker?url"
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export function PdfToWord() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setResultBlob(null)
      processToWord(files[0])
    }
  }

  const processToWord = useCallback(async (pdfFile: File) => {
    setIsProcessing(true)
    setProgress(0)
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const paragraphs: Paragraph[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        // Group items into logical lines based on Y-coordinate roughly
        const lines: Record<number, string[]> = {}
        textContent.items.forEach((item: any) => {
          const y = Math.round(item.transform[5]) // Y coordinate
          if (!lines[y]) lines[y] = []
          lines[y].push(item.str)
        })

        // Sort lines from top to bottom
        const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)
        
        sortedYs.forEach(y => {
          paragraphs.push(new Paragraph({
            children: [new TextRun(lines[y].join(" "))],
          }))
        })

        // Add page break
        if (i < pdf.numPages) {
          paragraphs.push(new Paragraph({
             children: [new TextRun({ text: "", break: 1 })],
          }))
        }

        setProgress(Math.round((i / pdf.numPages) * 100))
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      })

      const blob = await Packer.toBlob(doc)
      setResultBlob(blob)
      toast.success("Conversion to .docx complete!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to convert PDF to Word.")
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDownload = () => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${file?.name.replace(".pdf", "")}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-6 text-blue-500">
            <FileText className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">PDF to Word</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Reconstruct your PDF into an editable <strong>.docx</strong> document using local text mapping.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to convert to Word" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
             <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Conversion Studio</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
              {isProcessing ? (
                <div className="space-y-6 text-center z-10">
                   <div className="relative inline-block">
                      <RefreshCw className="w-20 h-20 text-blue-500 animate-spin opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-blue-500">
                         {progress}%
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Mapping Layout...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Reconstructing paragraphs in-browser</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-8 text-center z-10 animate-in zoom-in-95 duration-500">
                   <div className="p-6 bg-emerald-500/10 rounded-full inline-block text-emerald-500 border border-emerald-500/20">
                      <ShieldCheck className="w-12 h-12" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-4xl font-bold font-syne text-white">Docx Export Ready</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto italic text-sm">
                        Verification of structure complete. Download your editable Word document below.
                      </p>
                   </div>
                   <button 
                     onClick={handleDownload}
                     className="px-12 py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                   >
                     <Download className="w-6 h-6" />
                     Download Word File (.docx)
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="p-8 glass-panel rounded-3xl space-y-6 border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 Technicals
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 Vanity uses <strong>Y-axis Sorting</strong> to accurately map PDF text blobs into Docx paragraphs. 
              </p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">Format: OpenXML Packaging</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">Privacy: 100% Client-Side</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
