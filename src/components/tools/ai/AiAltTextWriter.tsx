import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Sparkles, RefreshCw, Eye, BrainCircuit, ShieldCheck, Copy, CheckCircle } from "lucide-react"
import { AnthropicKeyManager, useAnthropicKey } from "@/components/shared/AnthropicKeyManager"
import { callClaudeVision } from "@/lib/anthropic"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AiAltTextWriter() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [altText, setAltText] = useState("")
  const [copied, setCopied] = useState(false)
  const { key } = useAnthropicKey()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setPreviewUrl(URL.createObjectURL(files[0]))
      setAltText("")
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve((reader.result as string).split(",")[1])
      reader.onerror = (error) => reject(error)
    })
  }

  const generateAltText = async () => {
    if (!file || !key) return
    setIsProcessing(true)

    try {
      const responseText = await callClaudeVision({
         file,
         prompt: "Write a high-quality, descriptive alternative text for this image to be used for accessibility (screen readers). Keep it objective and concise, but include key visual details.",
         systemPrompt: "You are an accessibility expert.",
         maxTokens: 500
      })

      setAltText(responseText)
      toast.success("Alt-text generated!")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to call AI.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(altText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied!")
  }

  if (!file) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-12 animate-in fade-in duration-500">
         <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-6 text-emerald-500 border border-emerald-500/20">
               <Eye className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold font-syne mb-1 text-white">AI Alt-Text Writer</h1>
            <p className="text-muted-foreground text-lg mb-8">
               Generate professional accessibility descriptions for your images using Claude Vision.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnthropicKeyManager />
            <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Image Source</label>
                <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to describe" />
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
             <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Accessibility Engine</h1>
            <p className="text-muted-foreground text-sm">Powered by Claude 3 Vision</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-6">
           <div className="aspect-square glass-panel rounded-[2.5rem] overflow-hidden bg-black/40 border-white/5 shadow-2xl relative group">
              <img src={previewUrl!} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-700" alt="Preview" />
              {isProcessing && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-xs font-bold text-white uppercase tracking-widest">Analysing Pixels...</p>
                 </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-center space-y-8 py-8">
           {altText ? (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-3">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generated Description</h3>
                   <div className="p-8 bg-white/5 border border-white/5 rounded-3xl text-lg text-white/90 leading-relaxed font-syne">
                      "{altText}"
                   </div>
                </div>
                <button 
                  onClick={handleCopy}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  Copy Alt-Text
                </button>
             </div>
           ) : (
             <div className="space-y-8 text-center lg:text-left">
                <div className="space-y-2">
                   <h2 className="text-3xl font-bold font-syne text-white">Ready to describe.</h2>
                   <p className="text-muted-foreground">Claude will analyse the lighting, composition, and subjects to write a perfect screen-reader description.</p>
                </div>
                <button 
                  onClick={generateAltText}
                  disabled={!key || isProcessing}
                  className="px-12 py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 justify-center lg:justify-start"
                >
                  <Sparkles className="w-6 h-6" />
                  Generate Description
                </button>
                {!key && (
                   <p className="text-xs text-red-500 animate-pulse">Anthropic API Key required.</p>
                )}
             </div>
           )}

           <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
               <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Your image is transmitted over HTTPS directly to Anthropic's vision API. No intermediate servers are used, satisfying our commitment to maximum privacy.
               </p>
           </div>
        </div>
      </div>
    </div>
  )
}
