import React, { useState, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Sparkles, RefreshCw, Wand2, ShieldCheck, Download, Trash2 } from "lucide-react"
import { AnthropicKeyManager, useAnthropicKey } from "@/components/shared/AnthropicKeyManager"
import { callClaude } from "@/lib/anthropic"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function BgReplacer() {
  const [file, setFile] = useState<File | null>(null)
  const [noBgUrl, setNoBgUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("A professional studio with soft rim lighting and a minimalist aesthetic")
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedBg, setGeneratedBg] = useState("")
  const { key } = useAnthropicKey()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setNoBgUrl(null)
      setGeneratedBg("")
    }
  }

  const removeBackground = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const { removeBackground } = await import("@imgly/background-removal")
      const blob = await removeBackground(file)
      setNoBgUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
      toast.error("Background removal failed.")
    } finally {
      setIsProcessing(false)
    }
  }

  const generateNewBg = async () => {
    if (!key || !prompt) return
    setIsProcessing(true)

    try {
      const messages: { role: "user"; content: string }[] = [
        {
          role: "user",
          content: `Generate a gorgeous, responsive CSS/Tailwind background based on this description: "${prompt}". 
          Use gradients, SVG patterns, or multiple background layers. 
          Return ONLY the raw HTML string for a div that will serve as the background. 
          Exclude any explanation or code blocks.`
        }
      ]

      const responseText = await callClaude({
         messages,
         systemPrompt: "You are a master of CSS artistry and creative backgrounds.",
         maxTokens: 1500
      })
      setGeneratedBg(responseText)
      toast.success("New background generated!")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to generate background.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
         <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-6 text-emerald-500 border border-emerald-500/20">
               <Wand2 className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold font-syne mb-1 text-white">AI BG Replacer</h1>
            <p className="text-muted-foreground text-lg mb-8">
               Remove your background locally, then let Claude "imagine" a new set using CSS & SVG artistry.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnthropicKeyManager />
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Subject Source</label>
                <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to replace background" />
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
             <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Background Studio</h1>
            <p className="text-muted-foreground text-sm">Hybrid local-AI scene generation</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden bg-black/40 shadow-2xl border border-white/5 group">
              {/* The Generated Background */}
              {generatedBg && (
                 <div className="absolute inset-0 z-0 select-none pointer-events-none" dangerouslySetInnerHTML={{ __html: generatedBg }} />
              )}
              
              {/* The Subject */}
              <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
                {noBgUrl ? (
                   <img src={noBgUrl} className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in fade-in zoom-in-95 duration-700" alt="Subject" />
                ) : (
                   <div className="text-center space-y-4">
                      <img src={URL.createObjectURL(file)} className="max-w-64 max-h-64 rounded-3xl opacity-20 grayscale" alt="Original" />
                      {!isProcessing && (
                         <button onClick={removeBackground} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 transition-all">
                            First, Extract Subject
                         </button>
                      )}
                   </div>
                )}
              </div>

              {isProcessing && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-xs font-bold text-white uppercase tracking-widest">Processing Scene...</p>
                 </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="glass-panel p-8 rounded-3xl space-y-8 border-white/10 shadow-xl">
              <div className="space-y-4">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Describe New Scene</label>
                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white/90 outline-none focus:border-emerald-500/30 transition-all resize-none"
                    placeholder="E.g. A neon-lit cyberpunk street with rainy reflections..."
                 />
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                   onClick={generateNewBg}
                   disabled={!key || !noBgUrl || isProcessing}
                   className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                 >
                   <Sparkles className="w-5 h-5" />
                   Dream Background
                 </button>
                 {!noBgUrl && (
                    <p className="text-[10px] text-center text-muted-foreground animate-pulse">Extract the subject first to unlock generation.</p>
                 )}
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                     This tool uses <strong>Local WASM Segmentation</strong> to remove your background instantly, and <strong>Claude 3</strong> to generate the replacement scenery using advanced CSS code.
                  </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
