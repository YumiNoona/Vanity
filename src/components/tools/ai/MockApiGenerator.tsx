import React, { useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, Database, Copy, CheckCircle, SlidersHorizontal, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useActiveProvider } from "@/components/shared/ApiKeyManager"
import { AIProviderHint } from "@/components/shared/AIProviderHint"
import { AIProviderError, callAI } from "@/lib/ai-providers"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function MockApiGenerator() {
  const activeProvider = useActiveProvider()
  
  const [modelName, setModelName] = useState("User")
  const [schema, setSchema] = useState("id: uuid\nname: string\nemail: string\nrole: admin | user\ncreatedAt: iso_date")
  const [count, setCount] = useState<number>(5)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultJson, setResultJson] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()
  const requestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const generateMockData = async () => {
    if (!schema.trim()) return
    setIsProcessing(true)
    setResultJson("")
    setResultUrl(null)
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const systemPrompt = `You are a strict data generation API. You emit NOTHING but raw, valid JSON arrays.
CRITICAL INSTRUCTION: You MUST NOT use markdown code formatting. Do NOT wrap the JSON in \`\`\`json or \`\`\`.
Do not output any explanation. If the prompt fails, return an empty array [].
Your output must be immediately parsable by JavaScript's JSON.parse().`

      const prompt = `Generate exactly ${count} mock JSON objects representing the entity: ${modelName}.
Use this schema/field definition as a guide:
${schema}`

      const responseText = await callAI({
         prompt,
         systemPrompt,
         signal: controller.signal
      })

      let cleaned = responseText.trim()
      if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "")
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "")
      if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "")
      cleaned = cleaned.trim()

      try {
         const parsed = JSON.parse(cleaned)
         setResultJson(JSON.stringify(parsed, null, 2))
         setResultUrl(new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" }))
         toast.success("Mock dataset created!")
      } catch (parseError) {
         console.error("Claude returned invalid JSON:", cleaned)
         throw new Error("Claude returned malformed JSON structure.")
      }

    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message === "Request was cancelled.") {
        return
      }
      if (err instanceof AIProviderError) {
         toast.error(err.message)
      } else {
         toast.error(err.message || "An unknown error occurred during generation.")
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
      setIsProcessing(false)
    }
  }

  const handleCopy = () => {
     window.navigator.clipboard.writeText(resultJson)
     setCopied(true)
     toast.success("JSON copied to clipboard!")
     setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
     if (!resultUrl) return
     const a = document.createElement("a")
     a.href = resultUrl
     a.download = `mock_${modelName.toLowerCase()}_data.json`
     a.click()
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <ToolLayout 
      title="API Scaffold" 
      description={`Synthesize data structures accurately · ${activeProvider}`} 
      icon={Database} 
      onBack={handleBack} 
      backLabel="Back" 
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border-red-500/20 bg-black/40 space-y-6">
               <AIProviderHint />
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400 border-b border-white/5 pb-4">
                  <SlidersHorizontal className="w-4 h-4" /> Parameters
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Entity Name</label>
                  <input 
                     type="text" 
                     value={modelName}
                     onChange={(e) => setModelName(e.target.value)}
                     placeholder="e.g. Product"
                     className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm focus:border-red-500/50 outline-none text-white transition-colors"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                     <span>Schema Hinting</span>
                     <button onClick={() => setSchema("")} className="text-muted-foreground hover:text-white"><Trash2 className="w-3 h-3" /></button>
                  </label>
                  <textarea 
                     value={schema}
                     onChange={(e) => setSchema(e.target.value)}
                     placeholder="id: integer\ntitle: string\nprice: float"
                     className="w-full h-[150px] bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs focus:border-red-500/50 outline-none text-white transition-colors resize-none custom-scrollbar"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Object Count</label>
                  <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-xl p-3">
                     <input 
                        type="range" min="1" max="50" 
                        value={count} onChange={(e) => setCount(Number(e.target.value))} 
                        className="flex-1 accent-red-500"
                     />
                     <span className="font-mono text-xs text-red-400 font-bold">{count}</span>
                  </div>
               </div>

               <button 
                 onClick={generateMockData}
                 disabled={isProcessing || !schema.trim()}
                 className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 active:scale-95"
               >
                 {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Fetching Dataset...</> : <><Database className="w-5 h-5" /> Generate Seed Data</>}
               </button>
            </div>
         </div>

         <div className="lg:col-span-8">
            <div className="h-full min-h-[500px] flex flex-col relative glass-panel rounded-3xl border-white/5 bg-black/40 overflow-hidden">
               {isProcessing ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                     <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
                     <p className="font-mono text-sm text-red-200">Enforcing generic JSON strict boundaries...</p>
                  </div>
               ) : resultJson ? (
                  <div className="flex flex-col h-full absolute inset-0">
                     <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                        <span className="text-xs font-mono text-muted-foreground">response.json</span>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={handleCopy}
                             className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors"
                           >
                             {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy JSON
                           </button>
                           <button 
                             onClick={handleDownload}
                             className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-colors"
                           >
                             Save .json
                           </button>
                        </div>
                     </div>
                     <textarea 
                        readOnly
                        value={resultJson}
                        className="flex-1 w-full bg-transparent text-emerald-400 font-mono text-xs p-6 outline-none resize-none custom-scrollbar"
                     />
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50">
                     <Database className="w-12 h-12 mb-4 opacity-50" />
                     <p className="font-mono text-sm px-8 text-center">Describe your data structure and hit generate to populate a valid API dummy JSON array.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
