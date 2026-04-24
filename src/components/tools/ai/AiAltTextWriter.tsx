import React, { useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Sparkles, RefreshCw, Eye, BrainCircuit, ShieldCheck, Copy, CheckCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { useAIVisionTask } from "@/hooks/useAIVisionTask"
import { toast } from "sonner"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function AiAltTextWriter() {
  const [file, setFile] = useState<File | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const [isProcessing, setIsProcessing] = useState(false)
  const [altText, setAltText] = useState("")
  const [copied, setCopied] = useState(false)
  const activeProvider = useActiveProvider()
  const { isRunning, run } = useAIVisionTask()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setPreviewUrl(files[0])
      setAltText("")
    }
  }

  const generateAltText = async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const responseText = await run({
         file,
         prompt:
           "Write a high-quality, descriptive alternative text for this image to be used for accessibility (screen readers). Keep it objective and concise, but include key visual details.",
         systemPrompt: "You are an accessibility expert.",
      })

      setAltText(responseText)
      toast.success("Alt-text generated!")
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message === "Request was cancelled.") {
        return
      }
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

  const handleBack = () => {
    setFile(null)
    clearPreviewUrl()
    setAltText("")
  }

  if (!file) {
    return (
      <ToolUploadLayout 
        title="AI Alt-Text Writer" 
        description="Generate professional accessibility descriptions for your images using AI Vision." 
        icon={Eye}
      >
        <div className="space-y-6">
          <AIProviderHint />
          <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop photo to describe" />
        </div>
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout 
      title="Accessibility Engine" 
      description={`Provider: ${activeProvider}`} 
      icon={BrainCircuit} 
      onBack={handleBack} 
      backLabel="Change Image" 
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-6">
           <div className="aspect-square glass-panel rounded-[2.5rem] overflow-hidden bg-black/40 border-white/5 shadow-2xl relative group">
              {previewUrl && <img src={previewUrl} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-700" alt="Preview" />}
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
                      &quot;{altText}&quot;
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
                   <p className="text-muted-foreground">AI will analyse the lighting, composition, and subjects to write a perfect screen-reader description.</p>
                </div>
                <button 
                  onClick={generateAltText}
                  disabled={isProcessing || isRunning}
                  className="px-12 py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 justify-center lg:justify-start disabled:opacity-50"
                >
                  <Sparkles className="w-6 h-6" />
                  Generate Description
                </button>
             </div>
           )}

           <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                  Your image is transmitted securely to the AI provider. No intermediate servers are used, satisfying our commitment to maximum privacy.
               </p>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
