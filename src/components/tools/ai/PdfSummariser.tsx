import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Sparkles, RefreshCw, FileText, BrainCircuit, ShieldAlert } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { callAI } from "@/lib/ai-providers"
import { extractPdfText } from "@/lib/pdf-text"
import { toast } from "sonner"

export function PdfSummariser() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [summary, setSummary] = useState("")
  const [progress, setProgress] = useState(0)
  const activeProvider = useActiveProvider()
  const requestControllerRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
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
    runIdRef.current += 1
    const runId = runIdRef.current
    setIsProcessing(true)
    setSummary("")
    setProgress(0)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const { pageTexts } = await extractPdfText(file, {
        onProgress: (p) => {
          if (!isMountedRef.current || runId !== runIdRef.current) return
          setProgress(Math.round(p * 0.3))
        },
      })

      // Chunking strategy: Summarise in batches of 4 pages
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
        if (!isMountedRef.current || runId !== runIdRef.current) return
        setProgress(currentCompletion)
      }

      if (!isMountedRef.current || runId !== runIdRef.current) return
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
      if (isMountedRef.current && runId === runIdRef.current) {
        setIsProcessing(false)
      }
    }
  }

  const handleBack = () => {
    setFile(null)
    setSummary("")
    setProgress(0)
  }

  if (!file) {
    return (
      <ToolUploadLayout 
        title="AI PDF Summariser" 
        description="Upload a PDF to get private, AI-powered insights." 
        icon={BrainCircuit}
      >
        <div className="space-y-6">
          <AIProviderHint />
          <DropZone onDrop={handleDrop} accept={{ "application/pdf": [".pdf"] }} label="Drop PDF to summarise" />
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Insight Engine" 
      description={`${file.name} (${progress}% processed) · ${activeProvider}`} 
      icon={Sparkles} 
      onBack={handleBack} 
      backLabel="New File" 
      maxWidth="max-w-6xl"
    >
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
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Processing...</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">Analyzing document context</p>
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
                  Large PDFs often exceed AI context limits. We use a <strong>Multi-Chunk Recursive Summary</strong> approach to ensure every page is digested without forgetting the beginning.
               </p>
               <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex gap-3">
                  <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-orange-400">Processing large files will incur higher token costs on your AI account.</p>
               </div>
            </div>
        </div>
      </div>
    </ToolLayout>
  )
}
