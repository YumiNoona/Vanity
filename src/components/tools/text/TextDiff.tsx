import React, { useState, useMemo } from "react"
import { ArrowLeft, Diff, SplitSquareHorizontal, Layout, Trash2, Copy, CheckCircle } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { diff_match_patch } from "diff-match-patch"
import { toast } from "sonner"

export function TextDiff() {
  const [text1, setText1] = useState("")
  const [text2, setText2] = useState("")
  const [copied, setCopied] = useState(false)

  const diffResult = useMemo(() => {
    if (!text1.trim() && !text2.trim()) return null
    const dmp = new diff_match_patch()
    const diffs = dmp.diff_main(text1, text2)
    dmp.diff_cleanupSemantic(diffs)
    return diffs
  }, [text1, text2])

  const handleCopy = () => {
    if (!diffResult) return
    const text = (diffResult as [number, string][]).map(([op, data]: [number, string]) => data).join("")
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Merged text copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <ToolLayout 
      title="Diff Checker" 
      description="Compare two versions of text side-by-side." 
      icon={Diff} 
      onBack={handleBack} 
      backLabel="Back" 
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
        {/* Input Text A */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               Original Text (A)
            </label>
            <button onClick={() => setText1("")} className="text-muted-foreground hover:text-red-400 transition-colors">
               <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <textarea 
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder="Paste original version here..."
            className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-5 font-mono text-sm resize-none outline-none focus:border-blue-500/30 transition-all text-white/90"
          />
        </div>

        {/* Input Text B */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               Modified Text (B)
            </label>
            <button onClick={() => setText2("")} className="text-muted-foreground hover:text-red-400 transition-colors">
               <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <textarea 
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="Paste modified version here..."
            className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-5 font-mono text-sm resize-none outline-none focus:border-blue-500/30 transition-all text-white/90"
          />
        </div>
      </div>

      {/* Diff Result Area */}
      <div className="space-y-4 px-4 sm:px-0 mt-8">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             Comparison Results
          </label>
          <div className="flex gap-4">
            <button 
                onClick={handleCopy}
                disabled={!diffResult}
                className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-30"
            >
                {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                Copy Merged
            </button>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl min-h-[300px] overflow-auto bg-black/20 border-white/5 shadow-inner">
           {diffResult ? (
             <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {(diffResult as [number, string][]).map(([op, data]: [number, string], idx: number) => {
                  if (op === 0) return <span key={idx} className="text-white/40">{data}</span>
                  if (op === 1) return <span key={idx} className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded border border-emerald-500/20 mx-0.5">{data}</span>
                  if (op === -1) return <span key={idx} className="bg-red-500/20 text-red-500 p-0.5 rounded border border-red-500/20 line-through mx-0.5">{data}</span>
                  return null
                })}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 italic text-sm py-20">
                <SplitSquareHorizontal className="w-16 h-16 mb-4" />
                Provide text above to see differences
             </div>
           )}
        </div>
        
        <div className="flex gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Removed
           </div>
           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Added
           </div>
           <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground opacity-40">
              Unchanged text is dimmed
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
