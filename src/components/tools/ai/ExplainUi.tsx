import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Monitor, Loader2, Glasses, ListTree, MousePointer2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { AIProviderError, callAIVision } from "@/lib/ai-providers"

interface UiBreakdown {
  summary: string
  hierarchy: string[]
  interactivity: string[]
}

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function ExplainUi() {
  const activeProvider = useActiveProvider()
  const [file, setFile] = useState<File | null>(null)
  const { url: imgUrl, setUrl: setImgUrl, clear: clearImgUrl } = useObjectUrl()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [breakdown, setBreakdown] = useState<UiBreakdown | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setImgUrl(files[0])
      setBreakdown(null)
    }
  }

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const analyzeInterface = async () => {
    if (!file) return
    setIsProcessing(true)
    setBreakdown(null)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const prompt = `Analyze this user interface screenshot meticulously as an expert UX/UI engineer.
Provide a structural breakdown of the layout.
Return ONLY a valid JSON object with NO markdown blocks and NO explanatory text before or after.
JSON Structure requirement:
{
  "summary": "<A 2-3 sentence overview of the interfaces primary goal>",
  "hierarchy": ["<Component 1: Purpose>", "<Component 2: Purpose>"],
  "interactivity": ["<Interactive Element 1: Expected behavior>", "<Element 2: Expected behavior>"]
}`

      const systemPrompt = "You are a master product designer and UX engineer. Strictly adhere to returning JSON only."

      const responseText = await callAIVision({
         file,
         prompt,
         systemPrompt,
         signal: controller.signal
      })

      const cleaned = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim()
      const parsed = JSON.parse(cleaned) as UiBreakdown

      if (!parsed.summary || !Array.isArray(parsed.hierarchy)) {
         throw new Error("Invalid structure returned.")
      }

      setBreakdown(parsed)
      toast.success("UX breakdown complete!")

    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message === "Request was cancelled.") {
        return
      }
      if (err instanceof AIProviderError) {
         toast.error(err.message)
      } else if (err instanceof SyntaxError) {
         toast.error("Failed to parse the AI's response properly. Please try again.")
      } else {
         toast.error("An unknown error occurred during analysis.")
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    setFile(null)
    clearImgUrl()
    setBreakdown(null)
  }

  if (!file || !imgUrl) {
    return (
       <ToolUploadLayout title="Explain UI" description="Upload a screenshot of any application and let AI reverse-engineer its UX hierarchy." icon={Monitor}>
         <AIProviderHint />
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop UI Screenshot" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Explain UI" 
      description={`${file.name} · ${activeProvider}`} 
      icon={Monitor} 
      onBack={handleBack} 
      backLabel="Load Different" 
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="glass-panel p-4 rounded-3xl border-white/5 relative overflow-hidden bg-black/40 flex items-center justify-center min-h-[400px]">
               <img src={imgUrl} className="max-w-full max-h-[600px] object-contain rounded-2xl" alt="Target UI" />
            </div>

            {!isProcessing && !breakdown && (
               <button 
                 onClick={analyzeInterface}
                 className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-[0_0_25px_rgba(var(--primary),0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
               >
                 <Glasses className="w-5 h-5" /> Deconstruct Layout & Interactions
               </button>
            )}

            {isProcessing && (
               <div className="w-full py-4 bg-teal-500/10 text-teal-400 font-bold rounded-xl border border-teal-500/20 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Reverse-engineering UX...
               </div>
            )}
         </div>

         <div className="space-y-6">
            {breakdown && (
               <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                  <div className="glass-panel p-8 rounded-3xl border-teal-500/20 bg-teal-500/5">
                     <h3 className="text-xl font-bold font-syne text-teal-400 mb-4">Core Objective</h3>
                     <p className="text-white/90 leading-relaxed text-sm bg-black/40 p-4 rounded-xl border border-white/5">
                        {breakdown.summary}
                     </p>
                  </div>

                  <div className="glass-panel p-8 rounded-3xl border-white/5">
                     <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-6">
                        <ListTree className="w-4 h-4" /> Structural Hierarchy
                     </h4>
                     <ul className="space-y-3">
                        {breakdown.hierarchy.map((item, i) => {
                           const [title, desc] = item.split(":").map(s => s.trim())
                           return (
                              <li key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                 {desc ? (
                                    <>
                                       <span className="font-bold text-white text-sm">{title}</span>
                                       <span className="text-xs text-muted-foreground">{desc}</span>
                                    </>
                                 ) : (
                                    <span className="text-sm text-white/90">{item}</span>
                                 )}
                              </li>
                           )
                        })}
                     </ul>
                  </div>

                  <div className="glass-panel p-8 rounded-3xl border-white/5">
                     <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-6">
                        <MousePointer2 className="w-4 h-4" /> Expected Interactivity
                     </h4>
                     <ul className="space-y-3 relative">
                        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-amber-500/20" />
                        {breakdown.interactivity.map((item, i) => (
                           <li key={i} className="relative flex items-start gap-4 pl-8">
                              <div className="absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                              <span className="text-sm text-white/90 leading-relaxed">{item}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            )}
         </div>
      </div>
    </ToolLayout>
  )
}
