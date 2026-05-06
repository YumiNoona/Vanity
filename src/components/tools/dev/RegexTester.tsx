import React, { useState, useMemo } from "react"
import { toast } from "sonner"
import { Search, AlertCircle, Copy, CheckCircle, Terminal, Repeat, Book, HelpCircle, ArrowRight } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"

type ToolMode = "test" | "replace"

const COMMON_PATTERNS = [
  { label: "Email Address", value: "([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)\\.([a-zA-Z0-9_-]+)", flags: "gm", desc: "Matches standard email formats" },
  { label: "IPv4 Address", value: "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)", flags: "gm", desc: "Matches 0.0.0.0 to 255.255.255.255" },
  { label: "URL (HTTP/S)", value: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)", flags: "gm", desc: "Matches standard web URLs" },
  { label: "Date (YYYY-MM-DD)", value: "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])", flags: "gm", desc: "ISO 8601 date format" },
  { label: "Phone (International)", value: "\\+(?:[0-9] ?){6,14}[0-9]", flags: "gm", desc: "E.164 phone number format" },
  { label: "HTML Tag", value: "<([a-z1-6]+)([^>]*)>(.*?)<\\/\\1>", flags: "gms", desc: "Matches balanced HTML tags" },
]

const explainRegex = (pattern: string) => {
  if (!pattern) return [];
  const tokens = [];
  let i = 0;
  while (i < pattern.length) {
    let char = pattern[i];
    
    if (char === '\\') {
      const next = pattern[i + 1];
      if (next === 'd') tokens.push({ token: '\\d', desc: 'Any digit (0-9)' });
      else if (next === 'D') tokens.push({ token: '\\D', desc: 'Any non-digit' });
      else if (next === 'w') tokens.push({ token: '\\w', desc: 'Any word character' });
      else if (next === 'W') tokens.push({ token: '\\W', desc: 'Any non-word character' });
      else if (next === 's') tokens.push({ token: '\\s', desc: 'Any whitespace' });
      else if (next === 'S') tokens.push({ token: '\\S', desc: 'Any non-whitespace' });
      else if (next === 'b') tokens.push({ token: '\\b', desc: 'Word boundary' });
      else if (next === 'B') tokens.push({ token: '\\B', desc: 'Non-word boundary' });
      else tokens.push({ token: `\\${next}`, desc: `Escaped character '${next}'` });
      i += 2;
      continue;
    }
    
    if (char === '^') { tokens.push({ token: '^', desc: 'Start of line/string' }); i++; continue; }
    if (char === '$') { tokens.push({ token: '$', desc: 'End of line/string' }); i++; continue; }
    if (char === '.') { tokens.push({ token: '.', desc: 'Any character (except newline)' }); i++; continue; }
    if (char === '*') { tokens.push({ token: '*', desc: '0 or more times' }); i++; continue; }
    if (char === '+') { tokens.push({ token: '+', desc: '1 or more times' }); i++; continue; }
    if (char === '?') { tokens.push({ token: '?', desc: '0 or 1 time (optional/lazy)' }); i++; continue; }
    if (char === '|') { tokens.push({ token: '|', desc: 'Alternation (OR)' }); i++; continue; }
    
    if (char === '(') {
      if (pattern.slice(i, i + 3) === '(?:') {
        tokens.push({ token: '(?:', desc: 'Start of non-capturing group' });
        i += 3;
      } else if (pattern.slice(i, i + 4) === '(?=') {
        tokens.push({ token: '(?=', desc: 'Positive lookahead' });
        i += 4;
      } else if (pattern.slice(i, i + 4) === '(?!') {
        tokens.push({ token: '(?!', desc: 'Negative lookahead' });
        i += 4;
      } else {
        tokens.push({ token: '(', desc: 'Start of capturing group' });
        i++;
      }
      continue;
    }
    if (char === ')') { tokens.push({ token: ')', desc: 'End of group' }); i++; continue; }
    
    if (char === '[') {
      let j = i + 1;
      let inClass = '[';
      while (j < pattern.length && pattern[j] !== ']') {
        inClass += pattern[j];
        if (pattern[j] === '\\') {
          j++;
          if (j < pattern.length) inClass += pattern[j];
        }
        j++;
      }
      if (j < pattern.length) inClass += ']';
      
      const isNegated = inClass.startsWith('[^');
      tokens.push({ token: inClass, desc: `${isNegated ? 'Negated c' : 'C'}haracter class matching any ${isNegated ? 'NOT ' : ''}in list` });
      i = j + 1;
      continue;
    }
    
    if (char === '{') {
      let j = i + 1;
      let inQuant = '{';
      while (j < pattern.length && pattern[j] !== '}') {
        inQuant += pattern[j];
        j++;
      }
      if (j < pattern.length && /^\{\d+(,\d*)?\}$/.test(inQuant + '}')) {
        inQuant += '}';
        tokens.push({ token: inQuant, desc: `Quantifier: ${inQuant}` });
        i = j + 1;
        continue;
      }
    }
    
    tokens.push({ token: char, desc: `Literal '${char}'` });
    i++;
  }
  
  const merged = [];
  let currLiteral = '';
  for (const t of tokens) {
    if (t.desc.startsWith("Literal '")) {
      currLiteral += t.token;
    } else {
      if (currLiteral) {
        merged.push({ token: currLiteral, desc: `Literal string "${currLiteral}"` });
        currLiteral = '';
      }
      merged.push(t);
    }
  }
  if (currLiteral) {
    merged.push({ token: currLiteral, desc: `Literal string "${currLiteral}"` });
  }
  return merged;
}

export function RegexTester() {
  const [mode, setMode] = useState<ToolMode>("test")
  const [pattern, setPattern] = useState("([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)\\.([a-zA-Z0-9_-]+)")
  const [flags, setFlags] = useState("gm")
  const [testString, setTestString] = useState("Extract these emails: hello@vanity.venusapp.in\nAnd another: admin@example.com")
  const [replacement, setReplacement] = useState("REPLACED")
  
  const { copiedId, copy } = useCopyToClipboard()

  const { matches, error, highlightedText, replacedText } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, highlightedText: [{ text: testString, isMatch: false }], replacedText: testString }
    
    try {
      const regex = new RegExp(pattern, flags)
      const matchesData = []
      let match
      
      const tempRegex = new RegExp(pattern, flags)
      tempRegex.lastIndex = 0;
      
      if (flags.includes('g')) {
        while ((match = tempRegex.exec(testString)) !== null) {
          matchesData.push(match)
          if (match[0].length === 0) tempRegex.lastIndex++
        }
      } else {
        match = tempRegex.exec(testString)
        if (match) matchesData.push(match)
      }

      let textChunks = []
      if (matchesData.length > 0) {
        let currentIndex = 0
        matchesData.forEach((m, idx) => {
          if (m.index > currentIndex) {
            textChunks.push({ text: testString.slice(currentIndex, m.index), isMatch: false })
          }
          textChunks.push({ text: m[0], isMatch: true, matchIndex: idx })
          currentIndex = m.index + m[0].length
        })
        if (currentIndex < testString.length) {
          textChunks.push({ text: testString.slice(currentIndex), isMatch: false })
        }
      } else {
        textChunks = [{ text: testString, isMatch: false }]
      }

      const replaced = testString.replace(regex, replacement)

      return { matches: matchesData, error: null, highlightedText: textChunks, replacedText: replaced }
    } catch (e: any) {
      return { matches: [], error: e.message, highlightedText: [{ text: testString, isMatch: false }], replacedText: testString }
    }
  }, [pattern, flags, testString, replacement])

  const explanation = useMemo(() => explainRegex(pattern), [pattern])

  const applyPattern = (p: typeof COMMON_PATTERNS[0]) => {
    setPattern(p.value)
    setFlags(p.flags)
    toast.success(`${p.label} pattern applied`)
  }

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, "") : prev + flag)
  }

  const availableFlags = [
    { id: "g", label: "Global", desc: "Don't return after first match" },
    { id: "i", label: "Case Insensitive", desc: "Ignore casing" },
    { id: "m", label: "Multiline", desc: "^ and $ match lines" },
    { id: "s", label: "DotAll", desc: "Dot matches newline" }
  ]

  return (
    <ToolLayout 
      title="Regex Tester & Replacer" 
      description="Live evaluate, test, and perform bulk replacements with regular expressions." 
      icon={Terminal} 
      maxWidth="max-w-7xl"
      centered={true}
    >
      <div className="space-y-8 pb-20">
        <div className="flex justify-center">
          <PillToggle 
            activeId={mode}
            onChange={(id) => setMode(id as ToolMode)}
            options={[
              { id: "test", label: "Match & Test", icon: Search },
              { id: "replace", label: "Regex Replace", icon: Repeat },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Editor Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Regex Config */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
               <div className="flex items-center justify-between">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pattern Configuration</label>
                 <div className="flex gap-2">
                   {availableFlags.map(f => (
                     <button
                       key={f.id}
                       onClick={() => toggleFlag(f.id)}
                       title={f.desc}
                       className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border",
                         flags.includes(f.id) ? "bg-primary border-primary text-primary-foreground" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                       )}
                     >
                       {f.id}
                     </button>
                   ))}
                 </div>
               </div>
               
               <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 focus-within:border-primary/50 transition-all">
                 <span className="text-muted-foreground font-mono text-2xl">/</span>
                 <input 
                   value={pattern}
                   onChange={(e) => setPattern(e.target.value)}
                   className="flex-1 bg-transparent border-none outline-none font-mono text-lg text-white"
                   placeholder="regex pattern here..."
                   spellCheck={false}
                 />
                 <span className="text-muted-foreground font-mono text-2xl">/</span>
                 <span className="text-primary font-mono text-xl font-bold min-w-[40px] text-center">{flags}</span>
               </div>

               {error && (
                 <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl animate-in slide-in-from-top-2">
                   <AlertCircle className="w-4 h-4 shrink-0" />
                   <p className="font-medium">{error}</p>
                 </div>
               )}

               {mode === "replace" && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Replacement String</label>
                    <input 
                      value={replacement}
                      onChange={(e) => setReplacement(e.target.value)}
                      placeholder="Replacement text..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary/50 transition-all"
                    />
                 </div>
               )}
            </div>

            {/* Input & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Test String</label>
                 <textarea 
                   value={testString}
                   onChange={(e) => setTestString(e.target.value)}
                   className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-xs outline-none focus:border-primary/50 resize-none transition-all text-white/90"
                   spellCheck={false}
                   placeholder="Enter text to test against..."
                 />
               </div>

               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                   {mode === "test" ? "Match Preview" : "Replaced Result"}
                 </label>
                 <div className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-xs overflow-auto custom-scrollbar relative">
                   {mode === "test" ? (
                     <div className="whitespace-pre-wrap break-words leading-relaxed">
                       {highlightedText.map((chunk, i) => (
                         <span 
                           key={i} 
                           className={cn(
                             chunk.isMatch ? "bg-primary/30 text-primary-foreground rounded-sm ring-1 ring-primary/20 mx-[1px]" : "text-muted-foreground/60"
                           )}
                         >
                           {chunk.text}
                         </span>
                       ))}
                     </div>
                   ) : (
                     <div className="whitespace-pre-wrap break-words leading-relaxed text-emerald-400">
                       {replacedText}
                     </div>
                   )}
                   <button 
                     onClick={() => copy(mode === "test" ? testString : replacedText)} 
                     className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                   >
                     {copiedId === 'main' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                   </button>
                 </div>
               </div>
            </div>

            {/* Explanation Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Explain this Regex</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {explanation.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5 items-center">
                    <span className="font-mono text-primary font-bold text-sm min-w-[20px]">{item.token}</span>
                    <span className="text-xs text-muted-foreground break-words flex-1">{item.desc}</span>
                  </div>
                ))}
                {explanation.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 text-xs text-muted-foreground italic">
                    Type a regex pattern to see its explanation.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Library */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Common Patterns</span>
              </div>
              <div className="space-y-2">
                {COMMON_PATTERNS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyPattern(p)}
                    className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{p.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Results List (Test Mode Only) */}
            {mode === "test" && (
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6 max-h-[400px] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Groups</span>
                   </div>
                   <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{matches.length}</span>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar space-y-4 pr-2">
                  {matches.length > 0 ? (
                    matches.map((m, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-primary uppercase">Match {i+1}</span>
                          <button onClick={() => copy(m[0], `match-${i}`)} className="p-1 hover:text-white transition-all">
                             {copiedId === `match-${i}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="font-mono text-[10px] break-all text-white/80">{m[0]}</p>
                        {m.length > 1 && (
                          <div className="pt-2 border-t border-white/5 space-y-1">
                             {Array.from(m).slice(1).map((g, gi) => (
                               <div key={gi} className="flex gap-2 text-[9px] font-mono">
                                 <span className="text-muted-foreground">{gi+1}:</span>
                                 <span className="text-blue-400 break-all">{g || "null"}</span>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-20 italic text-xs">
                      No matches
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
