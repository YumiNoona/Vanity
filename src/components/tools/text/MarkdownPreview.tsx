import React, { useState, useEffect } from "react"
import { ArrowLeft, Eye, Layout, Copy, CheckCircle, Download, FileJson } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { marked } from "marked"
import { toast } from "sonner"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function MarkdownPreview() {
  const [input, setInput] = useState("# Welcome to Vanity\n\nStart typing **Markdown** to see the magic happen.\n\n- Local processing\n- Zero tracking\n- Instant preview\n\n```javascript\nconsole.log('Hello World');\n```")
  const [html, setHtml] = useState("")
  const [copied, setCopied] = useState(false)
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  useEffect(() => {
    const parse = async () => {
      const result = await marked.parse(input)
      setHtml(result)
      setResultUrl(new Blob([input], { type: "text/markdown" }))
    }
    parse()
  }, [input, setResultUrl])

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(html)
    setCopied(true)
    toast.success("HTML copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMd = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-export-${Date.now()}.md`
    a.click()
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <ToolLayout 
      title="Markdown Studio" 
      description="Write markdown, get beautiful live rendering." 
      icon={Eye} 
      onBack={handleBack} 
      backLabel="Back" 
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 pb-12 h-[calc(100vh-250px)]">
        {/* Editor Area */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               Markdown Editor
            </label>
            <button 
              onClick={handleDownloadMd}
              className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
            >
               <Download className="w-3 h-3" /> Download .md
            </button>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none focus:border-green-500/30 transition-all text-white/90 scrollbar-thin scrollbar-thumb-white/10"
            spellCheck={false}
          />
        </div>

        {/* Preview Area */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               Live Rendering
            </label>
            <button 
              onClick={handleCopyHtml}
              className="px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all font-syne"
            >
              {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              Copy HTML
            </button>
          </div>
          <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-8 overflow-auto scrollbar-thin scrollbar-thumb-white/10 prose prose-invert prose-emerald max-w-none shadow-inner">
             <div dangerouslySetInnerHTML={{ __html: html }} />
             {input === "" && (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 italic text-sm">
                  <Layout className="w-12 h-12 mb-4" />
                  Preview will appear here
               </div>
             )}
          </div>
        </div>
      </div>

      <style>{`
        .prose pre { background: rgba(0,0,0,0.4) !important; padding: 1rem; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.1); }
        .prose code { color: #10b981; font-weight: bold; }
        .prose h1, .prose h2, .prose h3 { margin-top: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem; }
        .prose blockquote { border-left-color: #10b981; background: rgba(16, 185, 129, 0.05); padding: 0.5rem 1rem; border-radius: 0 0.5rem 0.5rem 0; }
        .prose img { border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
      `}</style>
    </ToolLayout>
  )
}
