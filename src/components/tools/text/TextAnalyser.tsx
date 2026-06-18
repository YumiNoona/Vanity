import React, { useState, useMemo } from "react"
import { Search, FileText, Clock, Hash, TrendingUp, Trash2, Brain, AlertCircle, BookOpen } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { cn } from "@/lib/utils"

export function TextAnalyser() {
  const [input, setInput] = useState("")

  const stats = useMemo(() => {
    if (!input.trim()) return null

    const text = input.trim()
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const charCount = text.length
    const wordCount = words.length
    const sentenceCount = sentences.length || 1
    const readingTime = Math.ceil(wordCount / 200)

    // Syllable count heuristic
    const countSyllables = (word: string) => {
      word = word.toLowerCase().replace(/[^a-z]/g, "")
      if (word.length <= 3) return 1
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      word = word.replace(/^y/, "")
      const syllables = word.match(/[aeiouy]{1,2}/g)
      return syllables ? syllables.length : 1
    }

    let totalSyllables = 0
    let complexWords = 0
    words.forEach(w => {
      const s = countSyllables(w)
      totalSyllables += s
      if (s >= 3) complexWords++
    })

    // Flesch Reading Ease
    const fleschEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount)
    
    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * (wordCount / sentenceCount) + 11.8 * (totalSyllables / wordCount) - 15.59

    // Gunning Fog Index
    const gunningFog = 0.4 * ((wordCount / sentenceCount) + 100 * (complexWords / wordCount))

    // Word frequency (all words, top 100 with percentages)
    const wordFreq: Record<string, number> = {}
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (clean) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1
      }
    })

    const freqAnalysis = Object.entries(wordFreq)
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / wordCount) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100)

    return {
      wordCount,
      charCount,
      sentenceCount,
      readingTime,
      fleschEase: Math.round(fleschEase * 10) / 10,
      fleschKincaid: Math.round(fleschKincaid * 10) / 10,
      gunningFog: Math.round(gunningFog * 10) / 10,
      freqAnalysis,
      totalWords: wordCount
    }
  }, [input])

  const getEaseLabel = (score: number) => {
    if (score > 90) return { label: "Very Easy", desc: "5th grade level. Very easy to read.", color: "text-emerald-400" }
    if (score > 80) return { label: "Easy", desc: "6th grade level. Conversational English.", color: "text-emerald-500" }
    if (score > 70) return { label: "Fairly Easy", desc: "7th grade level.", color: "text-emerald-300" }
    if (score > 60) return { label: "Standard", desc: "8th-9th grade level.", color: "text-blue-400" }
    if (score > 50) return { label: "Fairly Difficult", desc: "High school level.", color: "text-yellow-400" }
    if (score > 30) return { label: "Difficult", desc: "College level.", color: "text-orange-400" }
    return { label: "Very Confusing", desc: "Graduate level. Best understood by university graduates.", color: "text-red-400" }
  }

  return (
    <ToolLayout 
      title="Text Analyser" 
      description="Advanced readability scoring and linguistic analysis." 
      icon={Search} 
      maxWidth="max-w-7xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 px-4 sm:px-0">
        {/* Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Content</label>
             <button onClick={() => setInput("")} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
             </button>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your article, essay, or email here..."
            className="w-full h-[600px] bg-black/40 border border-white/10 rounded-3xl p-8 font-mono text-sm leading-relaxed outline-none focus:border-primary/50 transition-all text-white/90 resize-none"
          />
        </div>

        {/* Stats */}
        <div className="lg:col-span-5 space-y-6">
          {stats ? (
            <>
              {/* Primary Stats */}
              <div className="grid grid-cols-3 gap-4">
                 {[
                   { label: "Words", value: stats.wordCount, icon: Hash, color: "text-blue-400" },
                   { label: "Sentences", value: stats.sentenceCount, icon: FileText, color: "text-purple-400" },
                   { label: "Reading", value: `${stats.readingTime}m`, icon: Clock, color: "text-orange-400" },
                 ].map(s => (
                   <div key={s.label} className="glass-panel p-4 rounded-2xl border border-white/5 bg-black/20 text-center">
                      <s.icon className={cn("w-4 h-4 mx-auto mb-2 opacity-50", s.color)} />
                      <div className="text-xl font-black font-mono text-white">{s.value}</div>
                      <div className="text-[9px] font-black uppercase text-muted-foreground mt-1">{s.label}</div>
                   </div>
                 ))}
              </div>

              {/* Readability Score Card */}
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
                 <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-primary">
                       <Brain className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Readability Ease</span>
                    </div>
                    <div className={cn("text-5xl font-black font-syne", getEaseLabel(stats.fleschEase).color)}>
                       {stats.fleschEase}
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-white">{getEaseLabel(stats.fleschEase).label}</p>
                       <p className="text-[10px] text-muted-foreground">{getEaseLabel(stats.fleschEase).desc}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black uppercase text-muted-foreground">Flesch-Kincaid Grade</span>
                       <div className="text-xl font-mono font-bold text-white">Lvl {stats.fleschKincaid}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] font-black uppercase text-muted-foreground">Gunning Fog Index</span>
                       <div className="text-xl font-mono font-bold text-white">{stats.gunningFog}</div>
                    </div>
                 </div>
              </div>

              {/* Word Frequency */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-sky-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Word Frequency</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded font-bold text-sky-400">{stats.totalWords} Total Words</span>
                 </div>
                 <div className="h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                    {stats.freqAnalysis.map((item, idx) => {
                       const maxPct = stats.freqAnalysis[0].percentage
                       const width = (item.percentage / maxPct) * 100
                       return (
                         <div key={item.word} className="bg-white/[0.02] border border-white/5 p-2 rounded-lg flex items-center justify-between relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                            <div className="absolute top-0 left-0 bottom-0 bg-sky-500/10 transition-all duration-1000 z-0" style={{ width: `${Math.max(1, width)}%` }} />
                            <div className="relative z-10 flex items-center gap-3">
                               <span className="text-[10px] font-bold text-muted-foreground w-3 text-right">{idx + 1}.</span>
                               <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{item.word}</span>
                            </div>
                            <div className="relative z-10 text-right">
                               <div className="font-mono text-xs font-bold text-white">{item.count}</div>
                               <div className="text-[9px] text-muted-foreground">{item.percentage.toFixed(2)}%</div>
                            </div>
                         </div>
                       )
                    })}
                 </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass-panel rounded-3xl border border-white/5 opacity-30 italic text-center space-y-4">
               <BookOpen className="w-16 h-16 text-muted-foreground" />
               <p className="text-sm px-12">Waiting for input to calculate linguistic and readability metrics...</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
