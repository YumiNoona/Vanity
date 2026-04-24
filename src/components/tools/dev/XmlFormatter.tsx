import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { FileCode, Copy, CheckCircle, Info, Braces, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function XmlFormatter() {
  const [input, setInput] = useState("")
  
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

  const handleFormat = () => {
    try {
      // Basic validation via DOMParser
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(input, "text/xml")
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("Invalid XML structure")
      }
      setInput(formatXml(input))
      toast.success("XML prettified!")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleMinify = () => {
    const minified = input.replace(/>\s*</g, "><").trim()
    setInput(minified)
    toast.success("XML minified!")
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(input)
    toast.success("Copied to clipboard")
  }

  return (
    <ToolLayout
      title="XML Formatter"
      description="Prettify, minify, and validate XML data structures locally."
      icon={FileCode}
    >
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XML Input</label>
              <button onClick={() => setInput("")} className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
           <textarea 
             value={input}
             onChange={e => setInput(e.target.value)}
             className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono focus:border-primary/50 outline-none transition-all resize-none"
             placeholder='<root><child>Data</child></root>'
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <button 
             onClick={handleFormat}
             className="py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
           >
             Prettify XML
           </button>
           <button 
             onClick={handleMinify}
             className="py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all"
           >
             Minify XML
           </button>
           <button 
             onClick={copyToClipboard}
             className="py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 hover:scale-[1.02] active:scale-95 transition-all"
           >
             <Copy className="w-4 h-4" /> Copy
           </button>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             Validation is performed using the browser's native DOMParser. All formatting logic is executed client-side.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
