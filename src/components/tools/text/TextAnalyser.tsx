import React, { useState, useMemo } from "react"
import { ArrowLeft, Search, FileText, Clock, Hash, TrendingUp, Trash2 } from "lucide-react"

export function TextAnalyser() {
  const [input, setInput] = useState("")

  const stats = useMemo(() => {
    if (!input.trim()) return null

    const words = input.trim().split(/\s+/).filter(w => w.length > 0)
    const charCount = input.length
    const wordCount = words.length
    const readingTime = Math.ceil(wordCount / 200) // Avg 200 wpm

    // Top 10 words
    const wordFreq: Record<string, number> = {}
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (clean.length > 2) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1
      }
    })

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    return {
      wordCount,
      charCount,
      readingTime,
      topWords
    }
  }, [input])

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mt-4 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
             <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Text Analyser</h1>
            <p className="text-muted-foreground text-sm">Deep statistics and word frequency analysis.</p>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0 pb-12">
        {/* Input Area */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paste Text</label>
            <button 
              onClick={() => setInput("")}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your content here for instant analysis..."
            className="w-full h-96 bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none focus:border-green-500/30 transition-all text-white/90"
          />
        </div>

        {/* Stats Panel */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-6 rounded-2xl space-y-2">
                  <div className="p-2 w-fit bg-blue-500/10 rounded-lg text-blue-500">
                    <Hash className="w-4 h-4" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">{stats.wordCount}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Words</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl space-y-2">
                  <div className="p-2 w-fit bg-purple-500/10 rounded-lg text-purple-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">{stats.charCount}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Characters</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl space-y-2">
                  <div className="p-2 w-fit bg-orange-500/10 rounded-lg text-orange-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">{stats.readingTime} min</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Reading Time</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl space-y-2">
                  <div className="p-2 w-fit bg-green-500/10 rounded-lg text-green-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">{stats.topWords.length}</h3>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Unique Words</p>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-2xl space-y-6 border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  Top 10 Most Common Words
                </h3>
                <div className="space-y-3">
                  {stats.topWords.length > 0 ? (
                    stats.topWords.map(([word, freq], idx) => (
                      <div key={word} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="text-sm font-medium text-white/80">{word}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-1 justify-end">
                           <div className="h-1.5 bg-white/5 rounded-full flex-1 max-w-[100px] overflow-hidden">
                              <div 
                                className="h-full bg-green-500/50 rounded-full" 
                                style={{ width: `${(freq / stats.topWords[0][1]) * 100}%` }}
                              />
                           </div>
                           <span className="text-xs font-mono text-green-500 font-bold w-6 text-right">{freq}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4">Not enough input to calculate density.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 glass-panel rounded-3xl opacity-30 italic text-sm text-center">
              <Search className="w-12 h-12 mb-4 text-muted-foreground" />
              <p>Analysis will appear here as you type...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
