import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Search, Info, Copy, CheckCircle, Languages, Binary, Code, Hash } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CharInfo {
  char: string
  codePoint: string
  hex: string
  utf8: string
  htmlEntity: string
  category: string
}

export function UnicodeExplorer() {
  const [input, setInput] = useState("Vanity ✨")
  const [selectedChar, setSelectedChar] = useState<CharInfo | null>(null)

  const analyze = (text: string) => {
    const chars = Array.from(text)
    return chars.map(c => {
      const cp = c.codePointAt(0) || 0
      return {
        char: c,
        codePoint: cp.toString(),
        hex: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
        utf8: encodeURIComponent(c).replace(/%/g, "\\x"),
        htmlEntity: `&#${cp};`,
        category: getCategory(c)
      }
    })
  }

  const getCategory = (c: string) => {
    // Simple heuristic for common categories
    if (/\p{L}/u.test(c)) return "Letter"
    if (/\p{N}/u.test(c)) return "Number"
    if (/\p{P}/u.test(c)) return "Punctuation"
    if (/\p{S}/u.test(c)) return "Symbol"
    if (/\p{Z}/u.test(c)) return "Separator"
    if (/\p{M}/u.test(c)) return "Mark"
    return "Other"
  }

  const results = analyze(input)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied: ${text}`)
  }

  return (
    <ToolLayout
      title="Unicode Explorer"
      description="Type or paste any text to inspect deep character data and encoding details."
      icon={Languages}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4">
           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input Text</label>
           <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-syne focus:border-primary/50 outline-none transition-all"
              placeholder="Paste text here..."
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 glass-panel rounded-3xl border border-white/5 bg-black/20 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Character Map</span>
                 <span className="text-[10px] font-mono text-muted-foreground">{results.length} characters</span>
              </div>
              <div className="p-6 flex flex-wrap gap-3">
                 {results.map((r, i) => (
                   <button
                     key={i}
                     onClick={() => setSelectedChar(r)}
                     className={cn(
                       "w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all border",
                       selectedChar?.char === r.char && selectedChar?.codePoint === r.codePoint
                         ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(245,158,11,0.2)] text-white scale-110"
                         : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10"
                     )}
                   >
                     {r.char === " " ? "␣" : r.char}
                   </button>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
              {selectedChar ? (
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                   <div className="flex flex-col items-center py-6 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-6xl mb-2">{selectedChar.char === " " ? "␣" : selectedChar.char}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-primary">{selectedChar.category}</span>
                   </div>

                   <div className="space-y-3">
                      {[
                        { label: "Code Point", value: selectedChar.codePoint, icon: Hash },
                        { label: "Hexadecimal", value: selectedChar.hex, icon: Code },
                        { label: "UTF-8 Bytes", value: selectedChar.utf8, icon: Binary },
                        { label: "HTML Entity", value: selectedChar.htmlEntity, icon: Info }
                      ].map(item => (
                        <div key={item.label} className="group p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:border-primary/30 transition-all">
                           <div className="flex items-center gap-2">
                              <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                           </div>
                           <button 
                             onClick={() => copyToClipboard(item.value)}
                             className="text-xs font-mono text-white/90 hover:text-primary transition-colors flex items-center gap-2"
                           >
                             {item.value}
                             <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center justify-center text-center space-y-4 py-20 opacity-50">
                   <Info className="w-12 h-12 text-muted-foreground" />
                   <p className="text-sm text-muted-foreground">Select a character to view detailed encoding information.</p>
                </div>
              )}
           </div>
        </div>
      </div>
      </div>
    </ToolLayout>
  )
}
