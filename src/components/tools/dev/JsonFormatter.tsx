import React, { useState, useCallback } from "react"
import { ArrowLeft, Copy, CheckCircle, Braces, AlignLeft, Minimize, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function JsonFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const validateAndFormat = useCallback((beautify: boolean) => {
    if (!input.trim()) {
      setOutput("")
      setError(null)
      return
    }

    try {
      const parsed = JSON.parse(input)
      const result = beautify 
        ? JSON.stringify(parsed, null, 2) 
        : JSON.stringify(parsed)
      
      setOutput(result)
      setError(null)
      if (beautify) toast.success("JSON Formatted!")
      else toast.success("JSON Minified!")
    } catch (e: any) {
      setError(e.message)
      toast.error("Invalid JSON")
    }
  }, [input])

  const handleCopy = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const highlightJson = (json: string) => {
    if (!json) return null
    
    // Simple regex-based syntax highlighting
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-blue-400' // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-primary font-bold' // key
        } else {
          cls = 'text-green-400' // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-orange-400' // boolean
      } else if (/null/.test(match)) {
        cls = 'text-gray-400' // null
      }
      return `<span class="${cls}">${match}</span>`
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mt-4 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
             <Braces className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne">JSON Formatter</h1>
            <p className="text-muted-foreground text-sm">Prettify, minify, and validate locally.</p>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 pb-12">
        {/* Input Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <AlignLeft className="w-3 h-3" /> Input JSON
            </label>
            <div className="flex gap-2">
                <button 
                onClick={() => setInput("")}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
                title="Clear"
                >
                <Trash2 className="w-3 h-3" />
                </button>
            </div>
          </div>
          <div className="relative group">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste your JSON here... {"example": "text"}'
              className={cn(
                "w-full h-[500px] bg-black/40 border rounded-xl p-6 font-mono text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-blue-500/20",
                error ? "border-red-500/50" : "border-white/10 group-hover:border-white/20"
              )}
            />
            {error && (
               <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs animate-in slide-in-from-bottom-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium truncate">{error}</span>
               </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <button 
               onClick={() => validateAndFormat(true)}
               className="py-4 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Braces className="w-4 h-4" /> Prettify
             </button>
             <button 
               onClick={() => validateAndFormat(false)}
               className="py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <Minimize className="w-4 h-4" /> Minify
             </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               Formatted JSON
            </label>
            <button 
              onClick={handleCopy}
              disabled={!output}
              className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          
          <div className="relative">
            <div className="w-full h-[500px] bg-black/20 border border-white/10 rounded-xl overflow-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
              {output ? (
                <pre 
                  className="font-mono text-sm leading-relaxed whitespace-pre"
                  dangerouslySetInnerHTML={{ __html: highlightJson(output) || "" }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 italic text-sm">
                   <Braces className="w-12 h-12 mb-4" />
                   Output will appear here
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Editor Stats</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="text-[10px] text-muted-foreground">Length: <span className="text-white font-mono">{output.length}</span></div>
                <div className="text-[10px] text-muted-foreground">Lines: <span className="text-white font-mono">{output.split('\n').length}</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
