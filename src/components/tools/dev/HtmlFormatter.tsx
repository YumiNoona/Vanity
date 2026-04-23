import React, { useState } from "react"
import { Code, Minimize2, Maximize2, Copy, Trash2, CheckCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

export function HtmlFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const formatHTML = (html: string) => {
    let formatted = ""
    let indent = ""
    const tab = "  "
    
    // Removing existing newlines and extra spaces between tags
    const cleanHTML = html.replace(/>\s+</g, "><").trim()
    
    cleanHTML.split(/>\s*</).forEach((element) => {
      // If it is a closing tag, decrease indent
      if (element.match(/^\/\w/)) {
        indent = indent.substring(tab.length)
      }
      
      formatted += indent + "<" + element + ">\n"
      
      // If it is an opening tag but not self-closing or a standard void tag, increase indent
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
    
    return formatted.trim().substring(1, formatted.length - 2) // Cleanup injected bounds
  }

  const minifyHTML = (html: string) => {
    return html
      .replace(/\s+/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/<!--.*?-->/g, "")
      .trim()
  }

  const handleFormat = () => {
    if (!input) return
    try {
      setOutput(formatHTML(input))
    } catch {
      setOutput("Error formatting HTML")
    }
  }

  const handleMinify = () => {
    if (!input) return
    setOutput(minifyHTML(input))
  }

  const handleCopy = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout title="HTML Formatter" description="Prettify or minify raw HTML code locally." icon={Code} maxWidth="max-w-6xl">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
         <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Input HTML</label>
              <button 
                onClick={() => { setInput(""); setOutput(""); }}
                className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-[500px] bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm resize-none outline-none focus:border-orange-500/30 transition-all text-white/90"
              placeholder="<div><p>Paste HTML here...</p></div>"
              spellCheck={false}
            />
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleFormat}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Maximize2 className="w-4 h-4" /> Prettify
              </button>
              <button 
                onClick={handleMinify}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Minimize2 className="w-4 h-4" /> Minify
              </button>
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-orange-500">Output Result</label>
              <button 
                onClick={handleCopy}
                disabled={!output}
                className="px-4 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs rounded-lg flex items-center gap-2 disabled:opacity-30 transition-all"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            
            <textarea
              readOnly
              value={output}
              className="w-full h-[500px] bg-black/20 border border-orange-500/20 rounded-xl p-4 font-mono text-sm resize-none outline-none break-all text-orange-100/90"
              placeholder="..."
              spellCheck={false}
            />
         </div>
      </div>
    </ToolLayout>
  )
}
