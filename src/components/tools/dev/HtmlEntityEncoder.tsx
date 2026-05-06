import React, { useState, useMemo } from "react"
import { Code, ArrowLeftRight, CheckCircle, Copy } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

export function HtmlEntityEncoder() {
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [encodeType, setEncodeType] = useState<"named" | "numeric">("named")
  const { isCopied, copy } = useCopyToClipboard()

  const output = useMemo(() => {
    if (!input) return ""
    if (mode === "encode") {
      if (encodeType === "named") {
        return input.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/¢/g, '&cent;')
                    .replace(/£/g, '&pound;')
                    .replace(/¥/g, '&yen;')
                    .replace(/€/g, '&euro;')
                    .replace(/©/g, '&copy;')
                    .replace(/®/g, '&reg;')
      } else {
        return input.replace(/[\u00A0-\u9999<>\&"'€£¥©®]/g, (i) => '&#' + i.charCodeAt(0) + ';')
      }
    } else {
      const txt = document.createElement("textarea")
      txt.innerHTML = input
      return txt.value
    }
  }, [input, mode, encodeType])

  const toggleMode = () => {
    setMode(m => m === "encode" ? "decode" : "encode")
    setInput(output)
  }

  return (
    <ToolLayout title="HTML Entity Encoder" description="Encode and decode HTML entities safely and instantly." icon={Code} centered={true} maxWidth="max-w-6xl">
      <div className="flex flex-col md:flex-row items-center gap-4 justify-center mb-8">
        <div className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${mode === "encode" ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
          Raw Text
        </div>
        
        <button 
          onClick={toggleMode}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 active:scale-95 group shadow-xl"
        >
          <ArrowLeftRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>

        <div className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${mode === "decode" ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
          Entities (&amp;lt;)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input</label>
            {mode === "encode" && (
              <select 
                value={encodeType} 
                onChange={e => setEncodeType(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase outline-none"
              >
                <option value="named" className="bg-zinc-900">Named (&amp;copy;)</option>
                <option value="numeric" className="bg-zinc-900">Numeric (&amp;#169;)</option>
              </select>
            )}
          </div>
          <textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full h-[400px] bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none focus:border-primary/50 transition-all custom-scrollbar text-white/90"
            placeholder={mode === "encode" ? "<div>Hello World</div>" : "&lt;div&gt;Hello World&lt;/div&gt;"}
            spellCheck={false}
          />
        </div>

        <div className="space-y-3 relative group">
          <div className="flex justify-between items-center">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Output</label>
             <button 
               onClick={() => output && copy(output)}
               className="p-1 text-muted-foreground hover:text-white transition-all"
             >
               {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
             </button>
          </div>
          <textarea 
            readOnly
            value={output}
            className="w-full h-[400px] bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none custom-scrollbar text-emerald-400/90"
            placeholder={`Output will appear here...`}
            spellCheck={false}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
