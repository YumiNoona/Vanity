import React, { useState } from "react"
import { ArrowLeft, Loader2, Database, Copy, CheckCircle, SlidersHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAnthropicKey, AnthropicKeyManager } from "@/components/shared/AnthropicKeyManager"
import { callClaude, ClaudeError } from "@/lib/anthropic"

export function MockApiGenerator() {
  const { key } = useAnthropicKey()
  
  const [modelName, setModelName] = useState("User")
  const [schema, setSchema] = useState("id: uuid\nname: string\nemail: string\nrole: admin | user\ncreatedAt: iso_date")
  const [count, setCount] = useState<number>(5)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultJson, setResultJson] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const generateMockData = async () => {
    if (!key || !schema.trim()) return
    setIsProcessing(true)
    setResultJson("")

    try {
      // Extremely strict system prompt based on user specs to avoid Markdown pollution
      const systemPrompt = `You are a strict data generation API. You emit NOTHING but raw, valid JSON arrays.
CRITICAL INSTRUCTION: You MUST NOT use markdown code formatting. Do NOT wrap the JSON in \`\`\`json or \`\`\`.
Do not output any explanation. If the prompt fails, return an empty array [].
Your output must be immediately parsable by JavaScript's JSON.parse().`

      const prompt = `Generate exactly ${count} mock JSON objects representing the entity: ${modelName}.
Use this schema/field definition as a guide:
${schema}`

      const responseText = await callClaude({
         messages: [{ role: "user", content: prompt }],
         systemPrompt,
         maxTokens: 3000
      })

      // Attempt parsing to guarantee it's valid JSON before displaying
      let cleaned = responseText.trim()
      if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "")
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "")
      if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "")
      cleaned = cleaned.trim()

      try {
         // Validate JSON syntax directly
         const parsed = JSON.parse(cleaned)
         setResultJson(JSON.stringify(parsed, null, 2))
         toast.success("Mock dataset created!")
      } catch (parseError) {
         console.error("Claude returned invalid JSON:", cleaned)
         throw new Error("Claude returned malformed JSON structure.")
      }

    } catch (err: any) {
      if (err instanceof ClaudeError) {
         toast.error(err.message)
      } else {
         toast.error(err.message || "An unknown error occurred during generation.")
      }
    } finally {
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
     const blob = new Blob([resultJson], { type: "application/json" })
     const url = URL.createObjectURL(blob)
     const a = document.createElement("a")
     a.href = url
     a.download = `mock_${modelName.toLowerCase()}_data.json`
     a.click()
     URL.revokeObjectURL(url)
  }

  if (!key) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-8 animate-in fade-in duration-500">
         <div className="text-center">
             <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-full mb-6 text-red-500">
                <Database className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-bold font-syne mb-2 text-white">Mock JSON Generator</h1>
             <p className="text-muted-foreground text-sm">Secure, direct browser integration with Anthropic Claude.</p>
         </div>
         <AnthropicKeyManager />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
             <Database className="w-6 h-6" />
           </div>
           <div>
             <h1 className="text-2xl font-bold font-syne text-white">API Scaffold</h1>
             <p className="text-muted-foreground text-sm font-mono">Synthesize data structures accurately</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border-red-500/20 bg-black/40 space-y-6">
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
                 className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
               >
                 {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Fetching Dataset...</> : <><Database className="w-5 h-5" /> Generate Seed Data</>}
               </button>
            </div>
         </div>

         <div className="lg:col-span-8">
            <div className="h-full flex flex-col relative glass-panel rounded-3xl border-white/5 bg-black/40 overflow-hidden">
               {isProcessing ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
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
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground/50">
                     <Database className="w-12 h-12 mb-4 opacity-50" />
                     <p className="font-mono text-sm px-8 text-center">Describe your data structure and hit generate to populate a valid API dummy JSON array.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
}
