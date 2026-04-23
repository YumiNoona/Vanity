import React, { useState, useMemo } from "react"
import { BarChart3, Trash2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

export function WordFrequency() {
  const [text, setText] = useState("")

  const { analysis, totalWords } = useMemo(() => {
    if (!text.trim()) return { analysis: [], totalWords: 0 }
    
    // Split by word boundaries (handling standard unicode/punctuation boundaries easily)
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    
    // Ignore common stop words? Let's just do pure frequency, users can filter mentally, or maybe all words.
    // Basic count dictionary
    const counts: Record<string, number> = {}
    words.forEach(w => {
      counts[w] = (counts[w] || 0) + 1
    })

    const total = words.length
    // Convert to sorted array
    const sorted = Object.entries(counts)
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100) // cap to top 100 to prevent ultra-lag on massive texts

    return { analysis: sorted, totalWords: total }
  }, [text])

  return (
    <ToolLayout title="Word Frequency Counter" description="Analyze text blocks to parse density patterns visually." icon={BarChart3} maxWidth="max-w-5xl">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
         <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Text Block</label>
              <button 
                onClick={() => setText("")}
                className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors"
                title="Clear"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-[600px] bg-black/40 border border-white/10 rounded-xl p-6 text-sm resize-none outline-none focus:border-sky-500/30 transition-all custom-scrollbar whitespace-pre-wrap leading-relaxed text-white/90"
              placeholder="Paste large text blocks here..."
              spellCheck={false}
            />
         </div>

         <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-sky-400">Frequency Analysis</label>
              {totalWords > 0 && <span className="text-xs px-2 py-1 bg-white/5 rounded text-sky-400 font-bold">{totalWords} Total Words</span>}
            </div>
            
            <div className="h-[600px] bg-black/20 border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar space-y-3">
               {analysis.length > 0 ? (
                 analysis.map((item, idx) => {
                   // Max percentage among top words becomes the ceiling for the visual bar (100% width of container)
                   const maxPct = analysis[0].percentage
                   const width = (item.percentage / maxPct) * 100
                   
                   return (
                     <div key={item.word} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex items-center justify-between relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-sky-500/10 transition-all duration-1000 z-0" 
                          style={{ width: `${Math.max(1, width)}%` }} 
                        />
                        <div className="relative z-10 flex items-center gap-4">
                           <span className="text-xs font-bold text-muted-foreground w-4 text-right">{idx + 1}.</span>
                           <span className="font-bold text-white group-hover:text-sky-400 transition-colors">{item.word}</span>
                        </div>
                        <div className="relative z-10 text-right">
                           <div className="font-mono font-bold text-white">{item.count}</div>
                           <div className="text-[10px] text-muted-foreground">{item.percentage.toFixed(2)}%</div>
                        </div>
                     </div>
                   )
                 })
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                    <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">Analysis pending input data</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </ToolLayout>
  )
}
