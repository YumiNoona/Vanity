import React, { useState, useMemo } from "react"
import { Search, AlertCircle, Copy, CheckCircle, Regex, Terminal } from "lucide-react"

export function RegexTester() {
  const [pattern, setPattern] = useState("([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)\\.([a-zA-Z0-9_-]+)")
  const [flags, setFlags] = useState("gm")
  const [testString, setTestString] = useState("Extract these emails: hello@vanity.tools\nAnd another: admin@example.com")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const { matches, error, highlightedText } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, highlightedText: [{ text: testString, isMatch: false }] }
    
    try {
      const regex = new RegExp(pattern, flags)
      const matchesData = []
      let match
      
      regex.lastIndex = 0;
      
      if (flags.includes('g')) {
        while ((match = regex.exec(testString)) !== null) {
          matchesData.push(match)
          if (match[0].length === 0) regex.lastIndex++
        }
      } else {
        match = regex.exec(testString)
        if (match) matchesData.push(match)
      }

      let textChunks = []
      if (matchesData.length > 0) {
        let currentIndex = 0
        matchesData.forEach((m, idx) => {
          if (m.index > currentIndex) {
            textChunks.push({ text: testString.slice(currentIndex, m.index), isMatch: false, matchIndex: -1 })
          }
          textChunks.push({ text: m[0], isMatch: true, matchIndex: idx })
          currentIndex = m.index + m[0].length
        })
        if (currentIndex < testString.length) {
          textChunks.push({ text: testString.slice(currentIndex), isMatch: false, matchIndex: -1 })
        }
      } else {
        textChunks = [{ text: testString, isMatch: false, matchIndex: -1 }]
      }

      return { matches: matchesData, error: null, highlightedText: textChunks }
    } catch (e: any) {
      return { matches: [], error: e.message, highlightedText: [{ text: testString, isMatch: false, matchIndex: -1 }] }
    }
  }, [pattern, flags, testString])

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""))
    } else {
      setFlags(flags + flag)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const availableFlags = [
    { id: "g", label: "Global", desc: "Don't return after first match" },
    { id: "i", label: "Case Insensitive", desc: "Case-insensitive matching" },
    { id: "m", label: "Multiline", desc: "^ and $ match start/end of line" },
    { id: "s", label: "DotAll", desc: "Dot (.) matches newline" }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 px-4 sm:px-0">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
           <Terminal className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-syne">Regex Tester</h1>
          <p className="text-muted-foreground text-sm">Live evaluate regular expressions with highlighting and group capture.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-4">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Regular Expression</label>
             <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-lg p-2 focus-within:border-blue-500/50 transition-colors">
               <span className="text-muted-foreground font-mono text-xl pl-2">/</span>
               <input 
                 value={pattern}
                 onChange={(e) => setPattern(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none font-mono text-sm"
                 placeholder="pattern..."
                 spellCheck={false}
               />
               <span className="text-muted-foreground font-mono text-xl">/</span>
               <div className="flex items-center bg-white/5 rounded pl-2">
                 <input 
                   value={flags}
                   onChange={(e) => setFlags(e.target.value)}
                   className="w-16 bg-transparent border-none outline-none font-mono text-sm text-primary tracking-widest"
                   placeholder="gim"
                   spellCheck={false}
                 />
               </div>
             </div>
             
             {error && (
               <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                 <AlertCircle className="w-4 h-4" /> {error}
               </div>
             )}

             <div className="flex flex-wrap gap-2 pt-2">
                {availableFlags.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleFlag(f.id)}
                    title={f.desc}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${flags.includes(f.id) ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-transparent border-white/5 hover:bg-white/5 text-muted-foreground'}`}
                  >
                    {f.id} — {f.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="glass-panel p-6 rounded-xl space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test String</label>
             <div className="relative isolate group">
                <textarea 
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  className="w-full min-h-[300px] bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm resize-y outline-none focus:border-blue-500/30 transition-all z-10 relative text-transparent caret-white"
                  spellCheck={false}
                />
                
                {/* Highlight Overlay */}
                <div 
                  className="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none z-0"
                  style={{ color: '#fff' }}
                >
                  {highlightedText.map((chunk, i) => (
                    <span 
                      key={i} 
                      className={chunk.isMatch ? "bg-blue-500/40 text-blue-100 rounded-[2px]" : "text-muted-foreground/60"}
                    >
                      {chunk.text}
                    </span>
                  ))}
                </div>
             </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-6 h-fit max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Match Results</label>
            <span className="text-xs px-2 py-1 bg-white/5 rounded text-primary font-bold">{matches.length} matches</span>
          </div>

          {!pattern || matches.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Search className="w-8 h-8 opacity-20 mb-4" />
              <p className="text-sm">No matches found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, idx) => (
                <div key={idx} className="bg-black/30 border border-white/5 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-white/5 flex items-center justify-between group bg-white/[0.02]">
                    <span className="text-xs font-bold text-primary">Match {idx + 1}</span>
                    <button 
                      onClick={() => copyToClipboard(match[0], idx)}
                      className="text-muted-foreground hover:text-white transition-colors"
                    >
                      {copiedIndex === idx ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="p-3 font-mono text-sm break-all text-blue-100">
                    {match[0]}
                  </div>
                  
                  {match.length > 1 && (
                    <div className="p-3 pt-0 space-y-2">
                       <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">Capture Groups</span>
                       {Array.from(match).slice(1).map((group, groupIdx) => (
                         <div key={groupIdx} className="flex gap-3 text-xs font-mono">
                           <span className="text-muted-foreground w-4 text-right">{groupIdx + 1}.</span>
                           <span className="text-white break-all">{group !== undefined ? group : <span className="opacity-30">undefined</span>}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
