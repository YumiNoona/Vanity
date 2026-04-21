import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Loader2, Download, Layers, CheckCircle, Image as ImageIcon, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { AIProviderError, callAIVision } from "@/lib/ai-providers"

interface ProcessedAltText {
  filename: string
  url: string
  alt: string
  status: "pending" | "processing" | "done" | "error"
}

import { useObjectUrl, useObjectUrls } from "@/hooks/useObjectUrl"

export function AltTextBatch() {
  const activeProvider = useActiveProvider()
  const [queue, setQueue] = useState<File[]>([])
  const [results, setResults] = useState<ProcessedAltText[]>([])
  const { urls, addUrl, removeUrl, clear: clearUrls } = useObjectUrls()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const requestControllerRef = useRef<AbortController | null>(null)
  const runIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      requestControllerRef.current?.abort()
    }
  }, [])

  const handleDrop = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const unique = newFiles.filter(nf => !queue.some(existing => existing.name === nf.name))
      setQueue(prev => [...prev, ...unique])
      
      const newItems: ProcessedAltText[] = unique.map(f => ({
         filename: f.name,
         url: addUrl(f),
         alt: "",
         status: "pending"
      }))
      setResults(prev => [...prev, ...newItems])
    }
  }

  const removeFile = (name: string) => {
    const item = results.find(r => r.filename === name)
    if (item) removeUrl(item.url)
    setQueue(queue.filter(f => f.name !== name))
    setResults(results.filter(r => r.filename !== name))
  }

  const processBatchSequentially = async () => {
    if (queue.length === 0) return
    runIdRef.current += 1
    const runId = runIdRef.current
    setIsProcessing(true)
    setProgress(0)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller
    
    // Reset any previously processed or errored state before beginning
    const currentResults = [...results]
    currentResults.forEach(r => {
       if (r.status === "error") r.status = "pending"
    })
    setResults(currentResults)

    const workQueue = [...queue]
    let completed = 0

    const prompt = `Write a concise, highly descriptive alt text for this image optimized for screen readers and SEO. 
Limit response to exactly one sentence. Do not prepend "An image of" or "A picture of". Just describe the subject, action, context, and mood.
Return ONLY the raw string. No markdown.`

    const systemPrompt = "You are an accessibility expert writing precise alt text."

    for (let i = 0; i < workQueue.length; i++) {
        if (!isMountedRef.current || runId !== runIdRef.current) break
        const file = workQueue[i]
        const resultIndex = currentResults.findIndex(r => r.filename === file.name)
        if (resultIndex === -1) continue
        
        // Skip items already successfully processed in a previous partial run
        if (currentResults[resultIndex].status === "done") {
           completed++
           if (isMountedRef.current && runId === runIdRef.current) {
             setProgress(Math.round((completed / workQueue.length) * 100))
           }
           continue
        }

        // Mark as processing
        currentResults[resultIndex].status = "processing"
        if (isMountedRef.current && runId === runIdRef.current) {
          setResults([...currentResults])
        }

        try {
           const response = await callAIVision({
              file,
              prompt,
              systemPrompt,
              signal: controller.signal
           })

           currentResults[resultIndex].alt = response.trim().replace(/^"/, "").replace(/"$/, "") // Handle if Claude quotes it
           currentResults[resultIndex].status = "done"
           completed++
        } catch (err: any) {
           if (err?.name === "AbortError" || err?.message === "Request was cancelled.") {
             break
           }
           currentResults[resultIndex].status = "error"
           currentResults[resultIndex].alt = err instanceof AIProviderError ? err.message : "Failed to generate alt text."
           if (isMountedRef.current && runId === runIdRef.current) {
             toast.error(`Error on ${file.name}: ${currentResults[resultIndex].alt}`)
           }
           // We intentionally do not throw to allow the bulk sequence to continue.
        }

        if (isMountedRef.current && runId === runIdRef.current) {
          setResults([...currentResults])
          setProgress(Math.round((completed / workQueue.length) * 100))
        }
    }

    if (isMountedRef.current && runId === runIdRef.current) {
      setIsProcessing(false)
    }
    if (isMountedRef.current && runId === runIdRef.current && controller.signal.aborted) {
       toast.info("Batch processing cancelled.")
    } else if (isMountedRef.current && runId === runIdRef.current && completed === workQueue.length) {
       toast.success("Batch generation complete!")
    } else if (isMountedRef.current && runId === runIdRef.current) {
       toast.warning(`Finished with ${workQueue.length - completed} errors.`)
    }
    if (requestControllerRef.current === controller) {
      requestControllerRef.current = null
    }
  }

  const downloadCsv = () => {
    if (resultUrl) {
       const a = document.createElement("a")
       a.href = resultUrl
       a.download = "vanity_alt_texts.csv"
       a.click()
       return
    }

    const header = ["Filename", "Alt Text"]
    const rows = results
       .filter(r => r.status === "done")
       .map(r => [
          `"${r.filename.replace(/"/g, '""')}"`,
          `"${r.alt.replace(/"/g, '""')}"`
       ])

    const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    setResultUrl(blob)
    
    const a = document.createElement("a")
    const tempUrl = URL.createObjectURL(blob)
    a.href = tempUrl
    a.download = "vanity_alt_texts.csv"
    a.click()
    URL.revokeObjectURL(tempUrl)
  }

  if (queue.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-pink-500/10 rounded-full mb-6 text-pink-500">
            <Layers className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">Batch Alt Text Generator</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Drop an entire folder of images to generate SEO-optimized alt text sequentially exporting directly to CSV.
         </p>
         <AIProviderHint />
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop multiple images" multiple />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
             <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Queue Manager</h1>
            <p className="text-muted-foreground text-sm font-mono">{queue.length} items loaded · {activeProvider}</p>
          </div>
        </div>
        <button onClick={() => { setQueue([]); setResults([]); clearUrls(); clearResultUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Fresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/5 pt-6">
         
         {/* Command Panel */}
         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-6 border-pink-500/20 bg-black/40">
               <h3 className="text-lg font-bold text-white font-syne mb-2">Sequential Processing</h3>
               <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Images are processed individually by Claude exactly in order to maintain completely predictable token costs uniformly.
               </p>

               <div className="pt-2">
                  <button 
                     onClick={processBatchSequentially}
                     disabled={isProcessing || results.every(r => r.status === "done")}
                     className="w-full py-4 bg-pink-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:bg-pink-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Queue...</> : "Generate Alt Texts"}
                  </button>
               </div>
               
               <button 
                  onClick={downloadCsv}
                  disabled={isProcessing || !results.some(r => r.status === "done")}
                  className="w-full py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
               >
                  <Download className="w-5 h-5" /> Export to CSV
               </button>
            </div>
            
            {/* Add More Dropzone */}
            <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-center flex flex-col items-center justify-center overflow-hidden relative">
               <input 
                  type="file" multiple accept="image/*" 
                  onChange={(e) => e.target.files && handleDrop(Array.from(e.target.files))} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <ImageIcon className="w-6 h-6 text-muted-foreground mb-2" />
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Drop more here</span>
            </div>
         </div>

         {/* Queue Area */}
         <div className="lg:col-span-8 flex flex-col h-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
             
             {isProcessing && (
                <div className="p-4 bg-pink-500/10 border-b border-pink-500/20 text-pink-400 flex flex-col gap-2 relative">
                   <div className="absolute top-0 bottom-0 left-0 bg-pink-500/20 transition-all duration-300" style={{ width: `${progress}%` }} />
                   <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Claude 3.5 evaluating...</span>
                      <span>{results.filter(r => r.status === "done").length} / {queue.length} Done ({progress}%)</span>
                   </div>
                </div>
             )}

             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar max-h-[600px]">
                {results.map((result, i) => (
                  <div key={result.filename} className={`flex flex-col gap-3 p-4 rounded-xl border ${result.status === "done" ? "bg-emerald-500/5 border-emerald-500/20" : result.status === "error" ? "bg-red-500/5 border-red-500/20" : result.status === "processing" ? "bg-pink-500/5 border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]" : "bg-white/5 border-white/5"} transition-colors`}>
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4 flex-1">
                           <img src={result.url} alt="Preview" className="w-12 h-12 rounded object-cover border border-white/10" />
                           <div className="flex col min-w-0 flex-1">
                              <span className="text-sm font-bold text-white truncate">{result.filename}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                 {result.status === "pending" && "Waiting"}
                                 {result.status === "processing" && <span className="text-pink-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Generating...</span>}
                                 {result.status === "done" && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Complete</span>}
                                 {result.status === "error" && <span className="text-red-400">Failed</span>}
                              </span>
                           </div>
                        </div>

                        {!isProcessing && result.status !== "processing" && (
                           <button onClick={() => removeFile(result.filename)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors shrink-0">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                     </div>

                     {(result.status === "done" || result.status === "error") && (
                        <div className={`text-sm p-3 rounded-lg border leading-relaxed ${result.status === "error" ? "bg-red-500/10 border-red-500/20 text-red-200" : "bg-black/40 border-white/5 text-white/90"}`}>
                           {result.alt}
                        </div>
                     )}
                  </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  )
}
