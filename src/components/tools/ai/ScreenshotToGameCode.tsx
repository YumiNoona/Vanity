import React, { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Code2, Copy, Cpu, Loader2, Sparkles, TriangleAlert } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { useObjectUrl } from "@/hooks/useObjectUrl"
import { safeImport } from "@/lib/utils/loader"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { callAIVision } from "@/lib/ai-providers"

let tesseractModule: any = null

type Mode = "gemini" | "ocr"
type Engine = "godot-gdscript" | "godot-csharp" | "unity-csharp" | "unreal-cpp"

const ENGINE_OPTIONS: { id: Engine; label: string; lang: string }[] = [
  { id: "godot-gdscript", label: "Godot (GDScript)", lang: "gdscript" },
  { id: "godot-csharp", label: "Godot (C#)", lang: "csharp" },
  { id: "unity-csharp", label: "Unity (C#)", lang: "csharp" },
  { id: "unreal-cpp", label: "Unreal (C++)", lang: "cpp" }
]

const GEMINI_SYSTEM_PROMPTS: Record<Engine, string> = {
  "godot-gdscript":
    "You are a senior Godot 4 developer. Output ONLY GDScript. Start with extends and the correct base class. Use @export for public vars. Add ## doc comments above every function. Include a header comment block explaining: what the script does, which node it attaches to, required dependencies, exported vars that need wiring in the editor.",
  "godot-csharp":
    "You are a senior Godot 4 C# developer. Output ONLY C#. Use [Export] attribute for inspector vars. Add XML doc comments on every method. Include a header comment block: what it does, which node it attaches to, dependencies.",
  "unity-csharp":
    "You are a senior Unity developer targeting Unity 6. Output ONLY C#. Use [SerializeField] for inspector fields. Add XML doc comments on every method. Include a header block: what it does, which GameObject it attaches to, required components, inspector fields to wire up.",
  "unreal-cpp":
    "You are a senior Unreal Engine 5 developer. Output ONLY a complete UE5 C++ header and source pair. Use UPROPERTY and UFUNCTION macros correctly. Add doxygen comments on every function. Include #pragma once. Header block: what it does, which Actor/Component class it extends, required includes."
}

const engineHumanName = (engine: Engine) => {
  return ENGINE_OPTIONS.find((e) => e.id === engine)?.label || "game code"
}

const stripNoiseLines = (text: string) => {
  return text
    .split("\n")
    .map((line) => line.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "").trimEnd())
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      if (trimmed.length <= 1) return false
      if (/^[|`~^*_.,;:'"!?-]+$/.test(trimmed)) return false
      return true
    })
}

const detectOcrLanguageHints = (text: string) => {
  const lc = text.toLowerCase()
  if (lc.includes("ufunction") || lc.includes("uproperty")) return "Unreal C++"
  if (lc.includes("@export") || lc.includes("extends ") || lc.includes("func ")) return "Godot GDScript"
  if (lc.includes("[serializefield]")) return "Unity C#"
  if (lc.includes("public class") || lc.includes("void ") || lc.includes("[export]")) return "C# style script"
  return "Unknown"
}

const functionLineRegex = /(func\s+\w+\s*\(|\b(?:public|private|protected|internal)?\s*(?:static\s+)?[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*\{?|UFUNCTION\s*\(|\w+\s*::\s*\w+\s*\()/

const formatOcrCode = (rawText: string, engine: Engine) => {
  const lines = stripNoiseLines(rawText)
  const languageHint = detectOcrLanguageHints(lines.join("\n"))
  const headerLines = [
    "/*",
    ` ScriptName: TODO_${engine.replace(/[^a-z0-9]/gi, "_")}`,
    " AttachTo: TODO_NodeOrActor",
    " Purpose: TODO_DescribePurpose",
    ` OCRLanguageHint: ${languageHint}`,
    "*/"
  ]
  const decorated: string[] = []
  for (const line of lines) {
    if (functionLineRegex.test(line)) {
      decorated.push("# TODO: verify OCR around function signature")
    }
    decorated.push(line)
  }
  return [...headerLines, "", ...decorated].join("\n")
}

export function ScreenshotToGameCode() {
  const [mode, setMode] = useState<Mode>("gemini")
  const [engine, setEngine] = useState<Engine>("godot-gdscript")
  const [contextHint, setContextHint] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const { url: previewUrl, setUrl: setPreviewUrl, clear: clearPreviewUrl } = useObjectUrl()
  const [isProcessing, setIsProcessing] = useState(false)
  const [outputCode, setOutputCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [ocrWarning, setOcrWarning] = useState(false)
  const requestControllerRef = useRef<AbortController | null>(null)
  const activeProvider = useActiveProvider()

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const codeLanguage = useMemo(() => ENGINE_OPTIONS.find((e) => e.id === engine)?.lang ?? "text", [engine])

  const handleDrop = (files: File[]) => {
    if (!files[0]) return
    setFile(files[0])
    setPreviewUrl(files[0])
    setOutputCode("")
    setOcrWarning(false)
  }

  const callGameVision = async (uploaded: File, signal: AbortSignal) => {
    const engineLabel = engineHumanName(engine)
    const contextPart = contextHint.trim() ? ` Context: ${contextHint.trim()}.` : ""
    const userPrompt = `Convert this code screenshot into clean, annotated ${engineLabel} code.${contextPart} Return ONLY the code with proper annotations. No explanation outside the code.`
    return callAIVision({
      file: uploaded,
      prompt: userPrompt,
      systemPrompt: GEMINI_SYSTEM_PROMPTS[engine],
      signal
    })
  }

  const runTesseractFallback = async (uploaded: File) => {
    if (!tesseractModule) {
      tesseractModule = await safeImport(() => import("tesseract.js"), "OCR engine")
    }
    const { recognize } = tesseractModule
    const result = await recognize(uploaded, "eng")
    return formatOcrCode(result?.data?.text || "", engine)
  }

  const handleGenerate = async () => {
    if (!file) return
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller
    setIsProcessing(true)
    setOcrWarning(false)

    try {
      if (mode === "gemini") {
        const generated = await callGameVision(file, controller.signal)
        setOutputCode(generated)
        toast.success("Game code generated!")
      } else {
        const generated = await runTesseractFallback(file)
        setOutputCode(generated)
        setOcrWarning(true)
        toast.success("OCR fallback output generated!")
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        toast.info("Generation cancelled.")
        return
      }
      toast.error(error?.message || "Failed to generate code.")
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
    if (!outputCode) return
    navigator.clipboard.writeText(outputCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast.success("Code copied!")
  }

  const handleBack = () => {
    requestControllerRef.current?.abort()
    setFile(null)
    clearPreviewUrl()
    setOutputCode("")
    setOcrWarning(false)
  }

  if (!file) {
    return (
      <ToolUploadLayout 
        title="Screenshot to Game Code" 
        description="Convert game code screenshots into clean, annotated source files using AI Vision." 
        icon={Code2}
      >
        <div className="glass-panel p-3 rounded-2xl border-white/10 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("gemini")}
              className={cn("py-3 rounded-xl text-sm font-bold transition-all", mode === "gemini" ? "bg-indigo-500 text-white" : "bg-white/5 text-muted-foreground")}
            >
              Gemini AI
            </button>
            <button
              onClick={() => setMode("ocr")}
              className={cn("py-3 rounded-xl text-sm font-bold transition-all", mode === "ocr" ? "bg-amber-500 text-black" : "bg-white/5 text-muted-foreground")}
            >
              Offline OCR
            </button>
          </div>
        </div>
        {mode === "gemini" && <AIProviderHint />}
        <DropZone onDrop={handleDrop} accept={{ "image/*": [] }} label="Drop code screenshot" />
      </ToolUploadLayout>
    )
  }

  return (
    <ToolLayout
      title="Screenshot to Game Code"
      description={`Provider: ${activeProvider} · Gemini Vision or Offline OCR fallback`}
      icon={Code2}
      onBack={handleBack}
      backLabel="Reset"
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-6 border-white/10">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Engine</label>
              <div className="grid grid-cols-1 gap-2">
                {ENGINE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setEngine(option.id)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-xs font-bold text-left transition-all",
                      engine === option.id ? "bg-indigo-500 text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "gemini" && (
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Context Hint (Optional)</label>
                <input
                  value={contextHint}
                  onChange={(e) => setContextHint(e.target.value)}
                  placeholder="2D platformer player controller"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500/30"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-3">
                <img src={previewUrl || ""} alt="Screenshot preview" className="w-full h-auto max-h-[280px] object-contain rounded-xl" />
              </div>
              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="w-full py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Generate Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {ocrWarning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-start gap-3">
              <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">Tesseract mode — output may contain OCR errors. Review before use.</p>
            </div>
          )}

          <div className="glass-panel rounded-3xl border-white/10 overflow-hidden min-h-[420px]">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Cpu className="w-4 h-4" /> Output ({engineHumanName(engine)})
              </div>
              <button
                onClick={handleCopy}
                disabled={!outputCode}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-30 active:scale-95"
              >
                {copied ? <Sparkles className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {outputCode ? (
              <pre className="p-5 overflow-auto text-sm leading-relaxed bg-black/40 h-[560px] custom-scrollbar">
                <code className={`language-${codeLanguage}`}>{outputCode}</code>
              </pre>
            ) : (
              <div className="h-[560px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Generate to see code output.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
