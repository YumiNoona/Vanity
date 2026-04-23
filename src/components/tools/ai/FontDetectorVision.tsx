import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Type, Loader2, Sparkles, ExternalLink, Info } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { AIProviderError, callAIVision } from "@/lib/ai-providers"

interface FontMatch {
  name: string
  confidence: number // 1-100
  characteristics: string
}

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function FontDetectorVision() {
  const activeProvider = useActiveProvider()
  const [file, setFile] = useState<File | null>(null)
  const { url: imgUrl, setUrl: setImgUrl, clear: clearImgUrl } = useObjectUrl()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [matches, setMatches] = useState<FontMatch[] | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setImgUrl(files[0])
      setMatches(null)
    }
  }

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const analyzeTypography = async () => {
    if (!file) return
    setIsProcessing(true)
    setMatches(null)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const prompt = `Analyze the typography in this image.
Identify the closest matching font families used for the dominant text. 
Return ONLY a valid JSON array of the top 3 closest matches, with NO markdown formatting, NO markdown blocks, and NO explanatory text.
JSON Structure requirement:
[
  { "name": "FontName", "confidence": 85, "characteristics": "sans-serif, geometric, high x-height" },
  { "name": "AlternativeFontName", "confidence": 70, "characteristics": "..." }
]`

      const systemPrompt = "You are a master typographer and graphic design expert. Strictly adhere to returning array JSON only."

      const responseText = await callAIVision({
         file,
         prompt,
         systemPrompt,
         signal: controller.signal
      })

      const cleaned = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim()
      const parsed = JSON.parse(cleaned) as FontMatch[]

      if (!Array.isArray(parsed) || !parsed[0]?.name) {
         throw new Error("Invalid structure returned.")
      }

      setMatches(parsed)
      toast.success("Typographic analysis complete!")

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
    setMatches(null)
  }

  if (!file || !imgUrl) {
    return (
       <ToolUploadLayout title="Font Matcher (Vision)" description="Drop a screenshot of any text to heuristically determine its closest typographic family." icon={Type}>
         <AIProviderHint />
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image with text" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Typography Analysis" 
      description={`${file.name} · ${activeProvider}`} 
      icon={Type} 
      onBack={handleBack} 
      backLabel="Load Different" 
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="glass-panel p-4 rounded-3xl border-white/5 relative overflow-hidden bg-black/40 flex items-center justify-center min-h-[300px]">
               <img src={imgUrl} className="max-w-full max-h-[400px] object-contain rounded-2xl" alt="Target Text" />
            </div>

            {!isProcessing && !matches && (
               <button 
                 onClick={analyzeTypography}
                 className="w-full py-4 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
               >
                 <Sparkles className="w-5 h-5" /> Analyze Font Families Visually
               </button>
            )}

            {isProcessing && (
               <div className="w-full py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" /> Inspecting glyphs & serifs...
               </div>
            )}
         </div>

         <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 text-amber-100 rounded-xl border border-amber-500/20">
               <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
               <div className="text-sm leading-relaxed">
                  <strong className="text-amber-300 block mb-1">Heuristic Estimation Pattern</strong>
                  AI vision tools provide a <strong className="text-white">closest visual match</strong> based on trained typographic datasets. This is not a bit-perfect extraction. Always verify the suggested fonts against your original image before purchasing licenses.
               </div>
            </div>

            {matches && (
               <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Closest Discovered Matches</h3>
                  
                  {matches.map((match, i) => (
                     <div key={i} className="glass-panel p-6 rounded-2xl border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex flex-col">
                              <h4 className="text-2xl font-bold text-white tracking-tight">{match.name}</h4>
                              <p className="text-xs text-muted-foreground font-mono mt-1">{match.characteristics}</p>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className={`text-lg font-black ${match.confidence > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{match.confidence}%</span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Confidence</span>
                           </div>
                        </div>

                        <a 
                          href={`https://fonts.google.com/?query=${encodeURIComponent(match.name)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-6 w-full py-3 bg-white/5 group-hover:bg-violet-500/20 group-hover:text-violet-300 text-sm font-bold text-muted-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                           Search on Google Fonts <ExternalLink className="w-4 h-4" />
                        </a>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </ToolLayout>
  )
}
