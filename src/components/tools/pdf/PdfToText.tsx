import React, { useState, useCallback } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, FileText, Download, Copy, CheckCircle, RefreshCw, FileSearch } from "lucide-react"
import { toast } from "sonner"
import { extractPdfText } from "@/lib/pdf-text"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function PdfToText() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = async (files: File[]) => {
    const uploadedFile = files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setExtractedText("")
    setResultUrl(null)
    processPdf(uploadedFile)
  }

  const processPdf = useCallback(async (pdfFile: File) => {
    setIsProcessing(true)
    setProgress(0)
    try {
      const { fullText } = await extractPdfText(pdfFile, {
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
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    toast.success("Text copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `${file?.name.replace(".pdf", "")}-text.txt`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-6 text-accent">
            <FileText className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">PDF to Text</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Extract raw text content from any PDF document page by page. 100% private.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF here to extract text" />
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
            <h1 className="text-3xl font-bold font-syne text-white">Extraction Hub</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearResultUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> New File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel p-8 rounded-3xl min-h-[500px] bg-black/40 overflow-hidden relative shadow-2xl border-white/5">
             {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                   <RefreshCw className="w-10 h-10 text-accent animate-spin" />
                   <div className="space-y-1 text-center">
                      <p className="text-sm font-bold text-white">Extracting Text...</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{progress}% Complete</p>
                   </div>
                </div>
             ) : (
                <textarea 
                  value={extractedText}
                  readOnly
                  className="w-full h-[600px] bg-transparent border-none outline-none font-mono text-xs leading-relaxed text-white/70 resize-none scrollbar-thin scrollbar-thumb-white/10"
                />
             )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="glass-panel p-8 rounded-2xl space-y-8 border-white/10">
              <div className="space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats</h4>
                 <div className="grid grid-cols-1 gap-2">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">Characters</span>
                       <span className="text-sm font-mono text-white font-bold">{extractedText.length}</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Words</span>
                       <span className="text-sm font-mono text-white font-bold">{extractedText.split(/\s+/).length}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                 <button 
                   onClick={handleCopy}
                   disabled={isProcessing || !extractedText}
                   className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                 >
                   {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                   Copy to Clipboard
                 </button>
                 <button 
                   onClick={handleDownload}
                   disabled={isProcessing || !extractedText}
                   className="w-full py-4 bg-accent text-accent-foreground font-bold rounded-xl shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                 >
                   <Download className="w-4 h-4" />
                   Download .txt
                 </button>
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10 text-xs text-muted-foreground leading-relaxed">
             <strong>Privacy Note:</strong> This extraction happens entirely on your machine using <code>pdfjs-dist</code>. The buffer is never sent to a server.
           </div>
        </div>
      </div>
    </div>
  )
}
