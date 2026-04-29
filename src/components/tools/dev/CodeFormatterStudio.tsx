import React, { useState, useCallback, useEffect } from "react"
import { Braces, Code, Database, FileCode, Copy, CheckCircle, Trash2, Maximize2, Minimize2, AlertCircle } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

type FormatMode = "json" | "html" | "sql" | "xml"

export function CodeFormatterStudio() {
  const [mode, setMode] = useState<FormatMode>("json")
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { isCopied: copied, copy } = useCopyToClipboard()

  // --- Formatting Logic ---

  const formatHTML = (html: string) => {
    let formatted = ""
    let indent = ""
    const tab = "  "
    const cleanHTML = html.replace(/>\s+</g, "><").trim()
    
    cleanHTML.split(/>\s*</).forEach((element) => {
      if (element.match(/^\/\w/)) indent = indent.substring(tab.length)
      formatted += indent + "<" + element + ">\n"
      if (
        element.match(/^<?\w[^>]*[^\/]$/) &&
        !element.startsWith("input") &&
        !element.startsWith("img") &&
        !element.startsWith("meta") &&
        !element.startsWith("link") &&
        !element.startsWith("br") &&
        !element.startsWith("hr") &&
        !element.startsWith("!DOCTYPE")
      ) {
        indent += tab
      }
    })
    return formatted.trim().substring(1, formatted.length - 2)
  }

  const formatSql = (sql: string) => {
    const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "GROUP BY", "ORDER BY", "INSERT INTO", "UPDATE", "DELETE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "ON", "LIMIT", "VALUES"]
    let formatted = sql
    keywords.forEach(k => {
      const regex = new RegExp(`\\b${k}\\b`, "gi")
      formatted = formatted.replace(regex, k)
    })
    const majorKeywords = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "INSERT INTO", "UPDATE", "DELETE", "JOIN"]
    majorKeywords.forEach(k => {
      const regex = new RegExp(`\\s+${k}\\b`, "g")
      formatted = formatted.replace(regex, `\n${k}`)
    })
    formatted = formatted.replace(/\s+AND\b/g, "\n  AND")
    formatted = formatted.replace(/\s+OR\b/g, "\n  OR")
    return formatted.trim()
  }

  const formatXml = (xml: string) => {
    let formatted = ""
    let indent = ""
    const tab = "  "
    xml.split(/>\s*</).forEach((node) => {
      if (node.match(/^\/\w/)) indent = indent.substring(tab.length)
      formatted += indent + "<" + node + ">\r\n"
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?")) indent += tab
    })
    return formatted.substring(1, formatted.length - 3)
  }

  const process = useCallback((beautify: boolean) => {
    if (!input.trim()) {
      setOutput("")
      setError(null)
      return
    }

    try {
      setError(null)
      if (mode === "json") {
        const parsed = JSON.parse(input)
        setOutput(beautify ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed))
      } else if (mode === "html") {
        setOutput(beautify ? formatHTML(input) : input.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim())
      } else if (mode === "sql") {
        setOutput(beautify ? formatSql(input) : input.replace(/\s+/g, " ").trim())
      } else if (mode === "xml") {
        if (beautify) {
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(input, "text/xml")
          if (xmlDoc.getElementsByTagName("parsererror").length > 0) throw new Error("Invalid XML structure")
          setOutput(formatXml(input))
        } else {
          setOutput(input.replace(/>\s*</g, "><").trim())
        }
      }
      toast.success(`${mode.toUpperCase()} ${beautify ? "Formatted" : "Minified"}!`)
    } catch (e: any) {
      setError(e.message)
      toast.error(`Invalid ${mode.toUpperCase()}`)
    }
  }, [input, mode])

  const handleCopy = () => {
    if (!output) return
    copy(output, "Copied to clipboard")
  }

  // --- Highlighting ---
  const highlight = (code: string) => {
    if (!code) return null
    if (mode === "json") {
      return code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-blue-400'
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'text-primary font-bold' : 'text-green-400'
        } else if (/true|false/.test(match)) {
          cls = 'text-orange-400'
        } else if (/null/.test(match)) {
          cls = 'text-gray-400'
        }
        return `<span class="${cls}">${match}</span>`
      })
    }
    // Generic fallback for others
    return code.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }

  return (
    <ToolLayout 
      title="Code Formatter Studio" 
      description="Standardize, beautify, and compress code across multiple formats." 
      icon={Code} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="space-y-8 px-4 sm:px-0 pb-12">
        <div className="flex justify-center">
           <PillToggle 
             activeId={mode}
             onChange={(id) => {
               setMode(id as FormatMode)
               setOutput("")
               setError(null)
             }}
             options={[
               { id: "json", label: "JSON", icon: Braces },
               { id: "html", label: "HTML", icon: Code },
               { id: "sql", label: "SQL", icon: Database },
               { id: "xml", label: "XML", icon: FileCode },
             ]}
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input {mode.toUpperCase()}</label>
              <button onClick={() => setInput("")} className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Paste your ${mode.toUpperCase()} here...`}
                className={cn(
                  "w-full h-[500px] bg-black/40 border rounded-2xl p-6 font-mono text-sm resize-none outline-none transition-all focus:ring-2 focus:ring-primary/20 text-white/90",
                  error ? "border-red-500/50" : "border-white/10 group-hover:border-white/20"
                )}
                spellCheck={false}
              />
              {error && (
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs animate-in slide-in-from-bottom-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium truncate">{error}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => process(true)} className="py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                <Maximize2 className="w-4 h-4" /> Prettify
              </button>
              <button onClick={() => process(false)} className="py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                <Minimize2 className="w-4 h-4" /> Minify
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Output Result</label>
              <button onClick={handleCopy} disabled={!output} className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-white/10 disabled:opacity-30 transition-all">
                {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="w-full h-[500px] bg-black/20 border border-white/10 rounded-2xl overflow-auto p-6 custom-scrollbar">
              {output ? (
                <pre 
                  className="font-mono text-sm leading-relaxed whitespace-pre text-white/90"
                  dangerouslySetInnerHTML={{ __html: mode === 'json' ? highlight(output) || "" : output.replace(/</g, "&lt;").replace(/>/g, "&gt;") }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 italic text-sm">
                  <Code className="w-12 h-12 mb-4" />
                  Result will appear here
                </div>
              )}
            </div>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 grid grid-cols-2 gap-4">
               <div className="text-[10px] text-muted-foreground font-bold uppercase">Size: <span className="text-white font-mono">{output.length} ch</span></div>
               <div className="text-[10px] text-muted-foreground font-bold uppercase">Lines: <span className="text-white font-mono">{output.split('\n').length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
