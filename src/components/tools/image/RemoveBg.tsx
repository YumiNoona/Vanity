import React, { useState, useEffect, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { Download, Loader2, Sparkles, Image, Wand2, RefreshCw } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { usePremium } from "@/hooks/usePremium"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { toast } from "sonner"
import { downloadBlob } from "@/lib/canvas"
import { safeImport } from "@/lib/utils/loader"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { callAI, AIProviderError } from "@/lib/ai-providers"
import { PillToggle } from "@/components/shared/PillToggle"

// Module-level cache for heavy library
let removeBgModule: any = null

export function RemoveBg() {
  const { validateFiles } = usePremium()
  const activeProvider = useActiveProvider()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const [mode, setMode] = useState<"standard" | "ai">("standard")
  const [prompt, setPrompt] = useState("A professional studio with soft rim lighting and a minimalist aesthetic")
  const [generatedBg, setGeneratedBg] = useState("")
  const [isGeneratingBg, setIsGeneratingBg] = useState(false)
  const requestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const generateNewBg = async () => {
    if (!prompt) return
    setIsGeneratingBg(true)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const responseText = await callAI({
         prompt: `Generate a gorgeous, responsive CSS/Tailwind background based on this description: "${prompt}".
          Use gradients, SVG patterns, or multiple background layers.
          Return ONLY the raw HTML string for a div that will serve as the background.
          Exclude any explanation or code blocks.`,
         systemPrompt: "You are a master of CSS artistry and creative backgrounds.",
         signal: controller.signal
      })
      setGeneratedBg(responseText)
      toast.success("New background generated!")
    } catch (err: any) {
      if (err?.name === "AbortError") return
      if (err instanceof AIProviderError) {
         toast.error(err.message)
      } else {
         toast.error(err.message || "Failed to generate background")
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsGeneratingBg(false)
    }
  }

  const handleProcess = async (uploadedFiles: File[]) => {
    if (isProcessing) return
    const uploadedFile = uploadedFiles[0]
    if (!uploadedFile || !validateFiles([uploadedFile])) return

    setFile(uploadedFile)
    setIsProcessing(true)
    setProgress(5)
    
    // Local scope for memory cleanup
    let blob: Blob | null = null
    
    try {
      // 1. Action-triggered dynamic import with caching
      if (!removeBgModule) {
        setProgress(10) // Show we've started loading engine
        removeBgModule = await safeImport(
          () => import("@imgly/background-removal"),
          "AI background removal engine"
        )
      }
      
      const { removeBackground } = removeBgModule
      
      // 2. Processing with progress
      blob = await removeBackground(uploadedFile, {
        progress: (key: string, current: number, total: number) => {
          // Progress reported by library can be noisy, we smooth it
          setProgress(prev => Math.min(prev + 2, 98))
        }
      })
      
      if (!blob) throw new Error("Processing failed to produce result")

      setProgress(100)
      setResultBlob(blob)
      setResultUrl(blob)
      
      toast.success("Background removed!")
      
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to remove background")
      setFile(null) // Reset on error
    } finally {
      setIsProcessing(false)
      // 3. Clean up reference pointers to help GC
      blob = null
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, `vanity-nobg-${file?.name || "image.png"}`)
  }

  const handleStartNew = () => {
    setFile(null)
    clearResultUrl()
    setResultBlob(null)
    setProgress(0)
  }

  if (!file) {
    return (
      <ToolUploadLayout
        title="Remove Background"
        description="Upload an image and instantly remove its background. Powered by AI, perfectly free, and processes entirely in your browser."
        icon={Image}
      >
        <DropZone onDrop={handleProcess} accept={{ "image/*": [] }} />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Remove Background"
      description={`File: ${file.name}`}
      icon={Image}
      centered={true}
    >

      <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+Cgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMzMzMiLz4KPHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzIyMjIyMiIvPgo8cmVjdCB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjIyMjIyIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==')]">
        
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur flex flex-col items-center justify-center z-10 transition-opacity">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold font-syne animate-pulse text-white">
              {progress < 15 ? "Loading AI Engine..." : "Removing Background..."}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center px-4">
              {progress < 15 
                ? "Fetching neural models (approx. 50MB)..." 
                : "AI is processing locally. Your image never leaves your device."}
            </p>
            <div className="w-64 h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

      {resultUrl && !isProcessing && (
        <div className="relative w-full max-w-3xl aspect-[4/3] rounded-[3rem] overflow-hidden bg-black/40 shadow-2xl border border-white/5">
          {generatedBg && (
            <div className="absolute inset-0 z-0 select-none pointer-events-none" dangerouslySetInnerHTML={{ __html: generatedBg }} />
          )}
          <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
            <img src={resultUrl} alt="Result" className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in fade-in zoom-in-95 duration-700" />
          </div>
        </div>
      )}
      </div>

      {resultUrl && !isProcessing && (
        <div className="space-y-6">
          <div className="flex justify-center">
            <PillToggle
              activeId={mode}
              onChange={(id) => setMode(id as any)}
              options={[
                { id: "standard", label: "Standard", icon: Image },
                { id: "ai", label: "AI Scene", icon: Wand2 },
              ]}
            />
          </div>

          {mode === "ai" ? (
            <div className="max-w-xl mx-auto space-y-4">
              <AIProviderHint />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white/90 outline-none focus:border-emerald-500/30 transition-all resize-none"
                placeholder="E.g. A neon-lit cyberpunk street with rainy reflections..."
              />
              <button
                onClick={generateNewBg}
                disabled={isGeneratingBg}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGeneratingBg ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Dream Background</>}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={handleDownload} className="px-8 py-4 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3 hover:scale-105">
                <Download className="w-6 h-6" /> Export
              </button>
              <button onClick={handleStartNew} className="px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all">
                Start New
              </button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
