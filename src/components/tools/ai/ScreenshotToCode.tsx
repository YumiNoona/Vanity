import React, { useEffect, useRef, useState } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Sparkles, RefreshCw, Monitor, Code, ShieldCheck, Copy, CheckCircle, Smartphone } from "lucide-react"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { callAIVision } from "@/lib/ai-providers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useObjectUrl } from "@/hooks/useObjectUrl"

export function ScreenshotToCode() {
  const [file, setFile] = useState<File | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const [isProcessing, setIsProcessing] = useState(false)
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const activeProvider = useActiveProvider()
  const requestControllerRef = useRef<AbortController | null>(null)

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setPreviewUrl(files[0])
      setCode("")
    }
  }

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const generateCode = async () => {
    if (!file) return
    setIsProcessing(true)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const responseText = await callAIVision({
         file,
         prompt: `Reconstruct this UI screenshot into clean, responsive HTML using Tailwind CSS. 
              - Return ONLY the raw HTML code block. 
              - Do not include any explanation. 
              - Use placeholder images for icons. 
              - Focus on high-fidelity spacing, colors, and typography.`,
         systemPrompt: "You are a senior front-end engineer specialized in Tailwind CSS.",
         signal: controller.signal
      })

      const rawCode = responseText.replace(/```html|```/g, "").trim()
      setCode(rawCode)
      toast.success("Code generated!")
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message === "Request was cancelled.") {
        return
      }
      console.error(error)
      toast.error(error.message || "Failed to generate code.")
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("HTML copied!")
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-6 text-emerald-500 border border-emerald-500/20">
               <Monitor className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold font-syne mb-1 text-white">Screenshot to Code</h1>
            <p className="text-muted-foreground text-lg mb-8">
               Convert any UI mockup or screenshot into clean Tailwind CSS + HTML code.
            </p>
         </div>

         <div className="space-y-6">
            <AIProviderHint />
            <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop screenshot here" />
         </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
             <Code className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Visual Coder</h1>
            <p className="text-muted-foreground text-sm">Translating pixels to responsive HTML · {activeProvider}</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearPreviewUrl(); setCode(""); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> New Screenshot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
           <div className="glass-panel p-4 rounded-[2rem] overflow-hidden bg-black/40 border-white/5 shadow-2xl relative group">
              <img src={previewUrl!} className="w-full h-auto rounded-3xl opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
              {isProcessing && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-xs font-bold text-white uppercase tracking-widest">Writing Code...</p>
                 </div>
              )}
           </div>

           <div className="glass-panel p-8 rounded-3xl space-y-6 border-white/5">
              {!code && (
                <button 
                  onClick={generateCode}
                  disabled={isProcessing}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-6 h-6" />
                  Generate Tailwind Code
                </button>
              )}
              {code && (
                <button 
                  onClick={handleCopy}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  Copy Code
                </button>
              )}
              
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                     Claude uses Vision tokens to map typography, colors, and layout hierarchies. Direct browser call ensures your mockups stay private.
                  </p>
              </div>
           </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-8 flex flex-col space-y-4">
           {code ? (
             <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setDevice("desktop")}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", device === "desktop" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                      >
                         <Monitor className="w-4 h-4 inline mr-2" /> Desktop
                      </button>
                      <button 
                        onClick={() => setDevice("mobile")}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", device === "mobile" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                      >
                         <Smartphone className="w-4 h-4 inline mr-2" /> Mobile
                      </button>
                   </div>
                </div>
                
                <div className={cn(
                  "flex-1 glass-panel rounded-3xl overflow-hidden bg-white border-white/10 shadow-inner transition-all duration-700 mx-auto",
                  device === "desktop" ? "w-full" : "w-[375px]"
                )}>
                   <iframe 
                     title="Preview"
                     className="w-full h-[600px] border-none"
                     srcDoc={`
                      <html>
                        <head>
                          <script src="https://cdn.tailwindcss.com"></script>
                        </head>
                        <body>${code}</body>
                      </html>
                     `}
                   />
                </div>
             </div>
           ) : (
             <div className="h-full bg-black/20 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center opacity-40">
                <Code className="w-16 h-16 mb-6" />
                <h3 className="text-xl font-bold font-syne text-white mb-2">Code Canvas Empty</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Upload a screenshot and click generate to see the HTML/Tailwind preview here.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
