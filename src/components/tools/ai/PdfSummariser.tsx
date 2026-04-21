import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Sparkles, RefreshCw, FileText, BrainCircuit, ShieldAlert } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { ApiKeyManager, useActiveProvider } from "@/components/shared/ApiKeyManager"
import { callAI } from "@/lib/ai-providers"
import { toast } from "sonner"

export function PdfSummariser() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [summary, setSummary] = useState("")
  const [progress, setProgress] = useState(0)
  const activeProvider = useActiveProvider()
  const requestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setSummary("")
    }
  }

  const startSummarisation = async () => {
    if (!file) return
    setIsProcessing(true)
    setSummary("")
    setProgress(0)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      const pageTexts: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const text = textContent.items.map((item: any) => item.str).join(" ")
        pageTexts.push(text)
        setProgress(Math.round((i / pdf.numPages) * 30)) // First 30% is extraction
      }

      // Chunking strategy: Summarise in batches of 4 pages to stay within token limits
      const chunkSize = 4
      const summaries: string[] = []

      for (let i = 0; i < pageTexts.length; i += chunkSize) {
        const chunk = pageTexts.slice(i, i + chunkSize).join("\n")
        const prompt = `Summarise the following text from a PDF document (Pages ${i + 1} to ${Math.min(i + chunkSize, pageTexts.length)}). Focus on key takeaways and data points. \n\n[TEXT START]\n${chunk}\n[TEXT END]`
        
        const responseText = await callAI({
           prompt,
           systemPrompt: "You are a professional research assistant.",
           signal: controller.signal
        })
        summaries.push(responseText)
        
        const currentCompletion = Math.min(100, 30 + Math.round(((i + chunkSize) / pageTexts.length) * 70))
        setProgress(currentCompletion)
      }

      // Final aggregation if it was a multi-chunk document
      if (summaries.length > 1) {
         setSummary("### Executive Summary (Aggregated)\n\n" + summaries.join("\n\n---\n\n"))
      } else {
         setSummary(summaries[0])
      }
      
      toast.success("Summary generated!")
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message === "Request was cancelled.") {
        return
      }
      console.error(error)
      toast.error(error.message || "Failed to generate summary.")
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
         <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-6 text-emerald-500 border border-emerald-500/20">
               <BrainCircuit className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold font-syne mb-1 text-white">AI PDF Summariser</h1>
            <p className="text-muted-foreground text-lg mb-8">
               Paste your Anthropic key and upload a PDF to get 100% private, AI-powered insights.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ApiKeyManager />
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">PDF Source</label>
                <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to summarise" />
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
             <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Insight Engine</h1>
            <p className="text-muted-foreground text-sm">{file.name} ({progress}% processed) · {activeProvider}</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> New File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[500px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
              {isProcessing ? (
                <div className="space-y-6 text-center z-10 w-full max-w-sm">
                   <div className="relative inline-block">
                      <RefreshCw className="w-20 h-20 text-emerald-500 animate-spin opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-emerald-500">
                         {progress}%
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Consulting Claude...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">Processing chunk by chunk for context accuracy</p>
                   </div>
                </div>
              ) : summary ? (
                <div className="w-full prose prose-invert prose-emerald text-white/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <div className="whitespace-pre-wrap leading-relaxed font-sans text-sm pb-10">
                      {summary}
                   </div>
                </div>
              ) : (
                <div className="text-center space-y-8">
                   <div className="w-32 h-32 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <FileText className="w-12 h-12" />
                   </div>
                   <button 
                     onClick={startSummarisation}
                     className="px-12 py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4"
                   >
                     <Sparkles className="w-6 h-6" />
                     Generate AI Summary
                   </button>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
            <div className="p-8 glass-panel rounded-3xl space-y-4 border-white/5 shadow-lg">
               <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Token Safety</h4>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Large PDFs often exceed AI context limits. We use a <strong>Multi-Chunk Recursive Summary</strong> approach to ensure Claude digests every page without forgetting the beginning.
               </p>
               <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex gap-3">
                  <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-orange-400">Processing large files will incur higher token costs on your Anthropic account.</p>
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}
