import React, { useState, useEffect } from "react"
import { ArrowLeftRight, FileJson, FileText, Copy, CheckCircle, AlertTriangle } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

export function YamlJsonConverter({ embedded = false }: { embedded?: boolean } = {}) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"json2yaml" | "yaml2json">("yaml2json")
  const [error, setError] = useState<string | null>(null)
  const { isCopied, copy } = useCopyToClipboard()

  useEffect(() => {
    const handleConvert = async () => {
      if (!input.trim()) {
        setOutput("")
        setError(null)
        return
      }

      try {
        const { default: yaml } = await import("js-yaml")
        if (mode === "yaml2json") {
          const obj = yaml.load(input)
          setOutput(JSON.stringify(obj, null, 2))
        } else {
          const obj = JSON.parse(input)
          setOutput(yaml.dump(obj, { indent: 2 }))
        }
        setError(null)
      } catch (e: any) {
        setError(e.message)
      }
    }

    handleConvert()
  }, [input, mode])

  const toggleMode = () => {
    setMode(m => m === "yaml2json" ? "json2yaml" : "yaml2json")
    setInput(output)
  }

  return (
    <ToolLayout 
      title="YAML ↔ JSON" 
      description="Convert seamlessly between YAML and JSON formats locally." 
      icon={ArrowLeftRight} 
      centered={true} 
      maxWidth="max-w-6xl"
      hideHeader={embedded}
    >
      <div className="flex flex-col md:flex-row items-center gap-4 justify-center mb-8">
        <div className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${mode === "yaml2json" ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
          <FileText className="w-4 h-4" /> YAML
        </div>
        
        <button 
          onClick={toggleMode}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 active:scale-95 group shadow-xl"
        >
          <ArrowLeftRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>

        <div className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${mode === "json2yaml" ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
          <FileJson className="w-4 h-4" /> JSON
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input</label>
          <textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full h-[500px] bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none focus:border-primary/50 transition-all custom-scrollbar text-white/90"
            placeholder={`Paste your ${mode === "yaml2json" ? "YAML" : "JSON"} here...`}
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
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
            className="w-full h-[500px] bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none custom-scrollbar text-emerald-400/90"
            placeholder={`Output will appear here...`}
            spellCheck={false}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
