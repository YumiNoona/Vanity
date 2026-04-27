import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { ArrowLeftRight, Copy, CheckCircle, Download, FileJson, Repeat, AlertCircle } from "lucide-react"
import * as toml from "smol-toml"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function TomlJson() {
  const [input, setInput] = useState(`[package]\nname = "vanity"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nreact = "18.2.0"`)
  const [output, setOutput] = useState("")
  const [direction, setDirection] = useState<"toml-to-json" | "json-to-toml">("toml-to-json")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const convert = () => {
    if (!input.trim()) {
      setOutput("")
      setError(null)
      return
    }

    try {
      if (direction === "toml-to-json") {
        const parsed = toml.parse(input)
        setOutput(JSON.stringify(parsed, null, 2))
      } else {
        const parsed = JSON.parse(input)
        setOutput(toml.stringify(parsed))
      }
      setError(null)
    } catch (err: any) {
      setError(err.message)
      setOutput("")
    }
  }

  useEffect(() => {
    convert()
  }, [input, direction])

  const toggleDirection = () => {
    setDirection(prev => (prev === "toml-to-json" ? "json-to-toml" : "toml-to-json"))
    setInput(output || "")
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  const handleDownload = () => {
    const ext = direction === "toml-to-json" ? "json" : "toml"
    const blob = new Blob([output], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `converted.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout
      title="TOML ↔ JSON"
      description="Instant, bidirectional conversion between TOML configuration and JSON."
      icon={Repeat}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {direction === "toml-to-json" ? "Input TOML" : "Input JSON"}
            </label>
            <button 
              onClick={toggleDirection}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-primary transition-all border border-white/5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <ArrowLeftRight className="w-3 h-3" /> Swap
            </button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 min-h-[400px] w-full bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm text-white/80 focus:border-primary/50 outline-none resize-none transition-all"
            placeholder={direction === "toml-to-json" ? "# Paste TOML here..." : "{ \"paste\": \"json here\" }"}
          />
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between h-[30px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {direction === "toml-to-json" ? "Output JSON" : "Output TOML"}
            </label>
            {output && !error && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="p-1.5 hover:text-white transition-colors">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={handleDownload} className="p-1.5 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="relative flex-1 min-h-[400px]">
            <pre className={cn(
              "absolute inset-0 w-full h-full bg-black/20 border border-white/5 rounded-2xl p-6 overflow-auto font-mono text-sm transition-all",
              error ? "border-red-500/20" : "border-white/5"
            )}>
              {error ? (
                <div className="flex items-start gap-3 text-red-400 bg-red-400/5 p-4 rounded-xl border border-red-400/10">
                   <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                   <span className="text-xs">{error}</span>
                </div>
              ) : (
                <code className="text-primary/90">{output}</code>
              )}
            </pre>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Developer Tip</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          TOML (Tom's Obvious, Minimal Language) is commonly used in Rust's Cargo.toml or Go's configuration files. This tool helps you bridge the gap between human-friendly TOML and machine-standard JSON.
        </p>
      </div>
    </ToolLayout>
  )
}
