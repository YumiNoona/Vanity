import React, { useState, useCallback } from "react"
import { ArrowLeft, Copy, CheckCircle, Hash, ArrowLeftRight, Trash2, FileCode, Upload } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function Base64Tool({ embedded = false }: { embedded?: boolean }) {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [copied, setCopied] = useState(false)

  const processText = useCallback((val: string, currentMode: "encode" | "decode") => {
    if (!val.trim()) {
      setOutput("")
      return
    }

    try {
      if (currentMode === "encode") {
        setOutput(btoa(val))
      } else {
        setOutput(atob(val))
      }
    } catch (e) {
      setOutput("Error: Invalid input for " + currentMode)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    processText(val, mode)
  }

  const toggleMode = () => {
    const newMode = mode === "encode" ? "decode" : "encode"
    setMode(newMode)
    // Swap input and output for convenience
    if (output && !output.startsWith("Error")) {
        setInput(output)
        processText(output, newMode)
    }
  }

  const handleCopy = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] || result
        setInput(`File: ${file.name}\nSize: ${file.size} bytes`)
        setOutput(base64)
        setMode("encode")
        toast.success("File encoded to Base64!")
    }
    reader.readAsDataURL(file)
  }

  return (
    <ToolLayout 
      title="Base64 Tool" 
      description="Encode or decode strings and files instantly." 
      icon={Hash} 
      maxWidth="max-w-6xl"
      hideHeader={embedded}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 pb-12">
        {/* Input Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
            </label>
            <div className="flex gap-2">
                <label className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-primary transition-colors cursor-pointer" title="Upload File">
                    <Upload className="w-3 h-3" />
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <button 
                  onClick={() => { setInput(""); setOutput(""); }}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
                  title="Clear"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
            </div>
          </div>
          <textarea 
            value={input}
            onChange={handleInputChange}
            placeholder={mode === "encode" ? "Enter text here..." : "Enter Base64 here..."}
            className="w-full h-80 bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none focus:border-blue-500/30 transition-all text-white/90"
          />
          <button 
            onClick={toggleMode}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-white/10 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Switch to {mode === "encode" ? "Decode" : "Encode"}
          </button>
        </div>

        {/* Output Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
               Result
            </label>
            <button 
              onClick={handleCopy}
              disabled={!output || output.startsWith("Error")}
              className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              Copy
            </button>
          </div>
          <div className="relative group">
            <textarea 
              readOnly
              value={output}
              className={cn(
                "w-full h-80 bg-black/20 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none break-all text-white/90",
                output.startsWith("Error") && "text-red-400 border-red-500/20"
              )}
            />
          </div>
          <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-muted-foreground leading-relaxed italic">
            Privacy Tip: All encoding and decoding is performed locally in your browser memory. Your data never leaves your device.
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
