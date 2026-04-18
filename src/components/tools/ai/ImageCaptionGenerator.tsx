import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Loader2, Sparkles, MessageSquare, Copy, CheckCircle, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { useAnthropicKey, AnthropicKeyManager } from "@/components/shared/AnthropicKeyManager"
import { callClaudeVision, ClaudeError } from "@/lib/anthropic"

export function ImageCaptionGenerator() {
  const { key } = useAnthropicKey()
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  
  const [tone, setTone] = useState<"professional" | "casual" | "humorous" | "academic">("casual")
  const [platform, setPlatform] = useState<"twitter" | "instagram" | "linkedin" | "blog">("instagram")
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [captions, setCaptions] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setImgUrl(URL.createObjectURL(files[0]))
      setCaptions([])
    }
  }

  const generateCaptions = async () => {
    if (!file || !key) return
    setIsProcessing(true)
    setCaptions([])

    try {
      const prompt = `Analyze this image carefully. Generate 3 distinct captions suitable for ${platform}.
Tone modifier: ${tone}.
Return ONLY a valid JSON array of strings containing the 3 captions. Absolutely no markdown blocks, no code fences, and no explanatory text before or after.
JSON Structure requirement:
["<caption 1>", "<caption 2>", "<caption 3>"]`

      const systemPrompt = "You are a master social media manager and creative writer. Strictly adhere to generating an exact JSON array of strings."

      const responseText = await callClaudeVision({
         file,
         prompt,
         systemPrompt,
         maxTokens: 800
      })

      const cleaned = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim()
      const parsed = JSON.parse(cleaned) as string[]

      if (!Array.isArray(parsed) || parsed.length === 0) {
         throw new Error("Invalid structure returned from Claude.")
      }

      setCaptions(parsed)
      toast.success("Captions generated!")

    } catch (err: any) {
      if (err instanceof ClaudeError) {
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

  if (!key) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-8 animate-in fade-in duration-500">
         <div className="text-center">
             <div className="inline-flex items-center justify-center p-3 bg-fuchsia-500/10 rounded-full mb-6 text-fuchsia-500">
                <MessageSquare className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-bold font-syne mb-2 text-white">AI Creative Captioning</h1>
             <p className="text-muted-foreground text-sm">Secure, direct browser integration with Anthropic Claude Vision.</p>
         </div>
         <AnthropicKeyManager />
      </div>
    )
  }

  if (!file || !imgUrl) {
    return (
       <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-fuchsia-500/10 rounded-full mb-6 text-fuchsia-500">
            <MessageSquare className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">Caption Generator</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Upload any image and let Claude write engaging, platform-perfect captions in seconds.
         </p>
         <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop image to caption" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-2 bg-fuchsia-500/10 rounded-lg text-fuchsia-500">
             <MessageSquare className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-2xl font-bold font-syne text-white">Content Studio</h1>
             <p className="text-muted-foreground text-sm font-mono">{file.name}</p>
           </div>
        </div>
        <button onClick={() => {setFile(null); setImgUrl(null); setCaptions([])}} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Try Another
        </button>
      </div>

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
                 disabled={isProcessing}
                 className="w-full mt-4 py-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
    </div>
  )
}
