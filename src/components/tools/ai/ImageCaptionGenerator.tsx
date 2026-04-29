import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Loader2, Sparkles, MessageSquare, Copy, CheckCircle, SlidersHorizontal } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { AIProviderError } from "@/lib/ai-providers"
import { useAIVisionTask } from "@/hooks/useAIVisionTask"

import { useObjectUrl } from "@/hooks/useObjectUrl"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

export function ImageCaptionGenerator() {
  const activeProvider = useActiveProvider()
  const [file, setFile] = useState<File | null>(null)
  const { url: imgUrl, setUrl: setImgUrl, clear: clearImgUrl } = useObjectUrl()
  
  const [tone, setTone] = useState<"professional" | "casual" | "humorous" | "academic">("casual")
  const [platform, setPlatform] = useState<"twitter" | "instagram" | "linkedin" | "blog">("instagram")
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [captions, setCaptions] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { isRunning, run } = useAIVisionTask()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setImgUrl(files[0])
      setCaptions([])
    }
  }

  const generateCaptions = async () => {
    if (!file) return
    setIsProcessing(true)
    setCaptions([])

    try {
      const prompt = `Analyze this image carefully. Generate 3 distinct captions suitable for ${platform}.
Tone modifier: ${tone}.
Return ONLY a valid JSON array of strings containing the 3 captions. Absolutely no markdown blocks, no code fences, and no explanatory text before or after.
JSON Structure requirement:
["<caption 1>", "<caption 2>", "<caption 3>"]`

      const systemPrompt = "You are a master social media manager and creative writer. Strictly adhere to generating an exact JSON array of strings."

      const responseText = await run({ file, prompt, systemPrompt })

      const cleaned = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim()
      const parsed = JSON.parse(cleaned) as string[]

      if (!Array.isArray(parsed) || parsed.length === 0) {
         throw new Error("Invalid structure returned from Claude.")
      }

      setCaptions(parsed)
      toast.success("Captions generated!")

    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message === "Request was cancelled.") {
        return
      }
      if (err instanceof AIProviderError) {
         toast.error(err.message)
      } else if (err instanceof SyntaxError) {
         toast.error("Failed to parse the AI's response properly. Please try again.")
      } else {
         toast.error("An unknown error occurred during generation.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = (text: string, index: number) => {
     window.navigator.clipboard.writeText(text)
     setCopiedIndex(index)
     toast.success("Caption copied!")
     setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (!file || !imgUrl) {
    return (
       <ToolUploadLayout title="AI Caption Generator" description="Upload any image and let Claude write engaging, platform-perfect captions in seconds." icon={MessageSquare}>
         <AIProviderHint />
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to caption" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="AI Caption Generator" 
      description={`${file.name} · ${activeProvider}`} 
      icon={MessageSquare} 
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-4 rounded-3xl border-white/5 relative bg-black/40 h-[300px] flex items-center justify-center">
               <img src={imgUrl} className="max-w-full max-h-full object-contain rounded-2xl" alt="Target" />
            </div>

            <div className="glass-panel p-6 rounded-3xl border-fuchsia-500/20 bg-black/40 space-y-6">
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fuchsia-400 border-b border-white/5 pb-4">
                  <SlidersHorizontal className="w-4 h-4" /> Parameters
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Platform</label>
                  <div className="grid grid-cols-2 gap-2">
                     {["instagram", "twitter", "linkedin", "blog"].map(plt => (
                        <button 
                          key={plt} 
                          onClick={() => setPlatform(plt as any)}
                          className={`py-2 text-xs font-bold rounded-lg capitalize transition-colors ${platform === plt ? "bg-fuchsia-500 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
                        >
                          {plt}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Tone of Voice</label>
                  <div className="grid grid-cols-2 gap-2">
                     {["casual", "professional", "humorous", "academic"].map(t => (
                        <button 
                          key={t} 
                          onClick={() => setTone(t as any)}
                          className={`py-2 text-xs font-bold rounded-lg capitalize transition-colors ${tone === t ? "bg-amber-500 text-black" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
                        >
                          {t}
                        </button>
                     ))}
                  </div>
               </div>

               <button 
                 onClick={generateCaptions}
                   disabled={isProcessing || isRunning}
                 className="w-full mt-4 py-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
               >
                 {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Drafting...</> : <><Sparkles className="w-5 h-5" /> Generate Options</>}
               </button>
            </div>
         </div>

         <div className="lg:col-span-8">
            <div className="h-full flex flex-col gap-4">
               {isProcessing ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-3xl border-transparent">
                     <Loader2 className="w-10 h-10 animate-spin text-fuchsia-500 mb-4" />
                     <p className="font-mono text-sm text-fuchsia-200">Writing creative variations...</p>
                  </div>
               ) : captions.length > 0 ? (
                  <div className="space-y-4 animate-in slide-in-from-bottom-6">
                     {captions.map((caption, i) => (
                        <div key={i} className="glass-panel p-6 rounded-2xl border-white/5 hover:border-fuchsia-500/30 transition-colors flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                           <p className="text-white/90 text-sm leading-relaxed flex-1 whitespace-pre-wrap">{caption}</p>
                           <button 
                             onClick={() => handleCopy(caption, i)}
                             className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors flex-shrink-0 flex items-center gap-2"
                           >
                              {copiedIndex === i ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              Copy
                           </button>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-3xl border-white/5 text-muted-foreground/50">
                     <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                     <p className="font-mono text-sm">Awaiting generation directives.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
