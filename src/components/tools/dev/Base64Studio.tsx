import React, { useState, useCallback } from "react"
import { ArrowLeft, Copy, CheckCircle, Hash, ArrowLeftRight, Trash2, FileCode, Upload } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

export function Base64Studio({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text")
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const { isCopied: copied, copy } = useCopyToClipboard()

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
    copy(output, "Copied to clipboard")
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
      <div className="flex justify-center mb-8">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => {
            setActiveTab(id as "text" | "file")
            setInput("")
            setOutput("")
          }}
          options={[
            { id: "text", label: "Text Mode", icon: Hash },
            { id: "file", label: "File Mode", icon: FileCode },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 pb-12">
        {/* Input Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              {activeTab === "text" ? (mode === "encode" ? "Text to Encode" : "Base64 to Decode") : "Select File"}
            </label>
            {activeTab === "text" && (
              <button 
                onClick={() => { setInput(""); setOutput(""); }}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
                title="Clear"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {activeTab === "text" ? (
            <>
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
            </>
          ) : (
            <div className="h-96">
              <ToolUploadLayout 
                title="" 
                description="" 
                icon={Upload} 
                hideHeader={true}
              >
                <div className="max-w-md mx-auto">
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all rounded-full" />
                    <label className="relative flex flex-col items-center justify-center p-12 bg-black/40 border-2 border-dashed border-white/10 rounded-[2rem] group-hover:border-primary/50 transition-all cursor-pointer">
                      <Upload className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-bold text-white mb-1">Click to upload file</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">or drag and drop</p>
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {input && (
                    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileCode className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono text-white truncate max-w-[200px]">{input.split('\n')[0].replace('File: ', '')}</span>
                      </div>
                      <button onClick={() => { setInput(""); setOutput(""); }} className="text-[10px] font-black uppercase text-red-400 hover:text-red-300">Remove</button>
                    </div>
                  )}
                </div>
              </ToolUploadLayout>
            </div>
          )}
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
