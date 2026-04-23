import React, { useState, useEffect } from "react"
import { Link2, ArrowLeftRight, Copy, CheckCircle, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

export function UrlEncoder() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      if (!input.trim()) {
        setOutput("")
        return
      }
      
      if (mode === "encode") {
        setOutput(encodeURIComponent(input))
      } else {
        setOutput(decodeURIComponent(input))
      }
    } catch (e) {
      setOutput("Error: Invalid input for decoding")
    }
  }, [input, mode])

  const toggleMode = () => {
    setMode(m => m === "encode" ? "decode" : "encode")
    if (output && !output.startsWith("Error")) {
      setInput(output)
    }
  }

  const handleCopy = () => {
    if (!output || output.startsWith("Error")) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout title="URL Encoder / Decoder" description="Safely encode or decode URLs and query string parameters." icon={Link2} maxWidth="max-w-6xl">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {mode === "encode" ? "String to Encode" : "URL to Decode"}
            </label>
            <button 
              onClick={() => { setInput(""); setOutput(""); }}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none focus:border-indigo-500/30 transition-all"
            placeholder={mode === "encode" ? "https://vanity.venusapp.in/?search=hello world" : "https%3A%2F%2Fvanity.venusapp.in%2F%3Fsearch%3Dhello%20world"}
            spellCheck={false}
          />
          <button 
            onClick={toggleMode}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Switch to {mode === "encode" ? "Decode" : "Encode"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Result</label>
            <button 
              onClick={handleCopy}
              disabled={!output || output.startsWith("Error")}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold rounded-lg flex items-center gap-2 disabled:opacity-30 transition-all"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy Result"}
            </button>
          </div>
          <textarea 
            readOnly
            value={output}
            className={`w-full h-[400px] bg-black/20 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none break-all ${output.startsWith("Error") ? "text-red-400 border-red-500/20" : "text-indigo-100"}`}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
