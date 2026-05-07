import React, { useState, useMemo } from "react"
import { toast } from "sonner"
import { Search, AlertCircle, Copy, CheckCircle, Terminal, Repeat, Book, HelpCircle, ArrowRight, Layers } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"

type ToolMode = "test" | "replace"

const COMMON_PATTERNS = [
  { label: "Email Address", value: "(?<user>[a-zA-Z0-9._-]+)@(?<domain>[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)", flags: "gm", desc: "Matches standard email formats with named groups" },
  { label: "IPv4 Address", value: "(?<ip>(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))", flags: "gm", desc: "Matches 0.0.0.0 to 255.255.255.255" },
  { label: "URL (HTTP/S)", value: "(?<protocol>https?:)\\/\\/(?<host>(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6})\\b(?<path>[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)", flags: "gm", desc: "Matches URLs with named protocol, host, and path" },
  { label: "Date (YYYY-MM-DD)", value: "(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12][0-9]|3[01])", flags: "gm", desc: "ISO date with named parts" },
  { label: "Phone (International)", value: "(?<cc>\\+?[0-9]{1,3})[ .-]?(?<area>[0-9]{3})[ .-]?(?<number>[0-9]{4,10})", flags: "gm", desc: "Phone format with country and area codes" },
  { label: "HTML Tag", value: "<(?<tag>[a-z1-6]+)(?<attrs>[^>]*)>(?<content>.*?)<\\/\\k<tag>>", flags: "gms", desc: "Matches tags using backreferences" },
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
      else if (next === 'k' && pattern[i+2] === '<') {
         let j = i + 3;
         let name = '';
         while (j < pattern.length && pattern[j] !== '>') { name += pattern[j]; j++; }
         tokens.push({ token: `\\k<${name}>`, desc: `Backreference to named group "${name}"` });
         i = j + 1; continue;
      }
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
        tokens.push({ token: '(?:', desc: 'Non-capturing group' });
        i += 3;
      } else if (pattern.slice(i, i + 4) === '(?<=') {
        tokens.push({ token: '(?<=', desc: 'Positive lookbehind' });
        i += 4;
      } else if (pattern.slice(i, i + 5) === '(?<!') {
        tokens.push({ token: '(?<!', desc: 'Negative lookbehind' });
        i += 5;
      } else if (pattern.slice(i, i + 4) === '(?=') {
        tokens.push({ token: '(?=', desc: 'Positive lookahead' });
        i += 4;
      } else if (pattern.slice(i, i + 4) === '(?!') {
        tokens.push({ token: '(?!', desc: 'Negative lookahead' });
        i += 4;
      } else if (pattern.slice(i, i + 3) === '(?<') {
        let j = i + 3;
        let name = '';
        while (j < pattern.length && pattern[j] !== '>') { name += pattern[j]; j++; }
        tokens.push({ token: `(?<${name}>`, desc: `Named capturing group: "${name}"` });
        i = j + 1;
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
        if (pattern[j] === '\\') { j++; if (j < pattern.length) inClass += pattern[j]; }
        j++;
      }
      if (j < pattern.length) inClass += ']';
      const isNegated = inClass.startsWith('[^');
      tokens.push({ token: inClass, desc: `${isNegated ? 'Negated c' : 'C'}haracter class` });
      i = j + 1; continue;
    }
    
    if (char === '{') {
      let j = i + 1;
      let inQuant = '{';
      while (j < pattern.length && pattern[j] !== '}') { inQuant += pattern[j]; j++; }
      if (j < pattern.length && /^\{\d+(,\d*)?\}$/.test(inQuant + '}')) {
        inQuant += '}';
        tokens.push({ token: inQuant, desc: `Quantifier: ${inQuant}` });
        i = j + 1; continue;
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
        merged.push({ token: currLiteral, desc: `Literal "${currLiteral}"` });
        currLiteral = '';
      }
      merged.push(t);
    }
  }
  if (currLiteral) merged.push({ token: currLiteral, desc: `Literal "${currLiteral}"` });
  return merged;
}

export function RegexTester() {
  const [mode, setMode] = useState<ToolMode>("test")
  const [pattern, setPattern] = useState("(?<user>[a-zA-Z0-9._-]+)@(?<domain>[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)")
  const [flags, setFlags] = useState("gm")
  const [testString, setTestString] = useState("Contact us at: support@vanity.app\nBilling: accounts@venus.in")
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

  const availableFlags = [
    { id: "g", label: "Global", desc: "Find all matches" },
    { id: "i", label: "Case Insensitive", desc: "Ignore casing" },
    { id: "m", label: "Multiline", desc: "^ and $ match lines" },
    { id: "s", label: "DotAll", desc: "Dot matches newline" },
    { id: "u", label: "Unicode", desc: "Unicode support" }
  ]

  return (
    <ToolLayout title="Regex Studio" description="Powerful pattern matching with named group support and live explanations." icon={Terminal} maxWidth="max-w-7xl" centered>
      <div className="space-y-8 pb-20">
        <div className="flex justify-center">
          <PillToggle activeId={mode} onChange={(id) => setMode(id as ToolMode)} options={[{ id: "test", label: "Test Patterns", icon: Search }, { id: "replace", label: "Batch Replace", icon: Repeat }]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
               <div className="flex items-center justify-between">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pattern</label>
                 <div className="flex gap-1.5">
                   {availableFlags.map(f => (
                     <button key={f.id} onClick={() => setFlags(prev => prev.includes(f.id) ? prev.replace(f.id, "") : prev + f.id)} title={f.desc} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border", flags.includes(f.id) ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-muted-foreground")}>
                       {f.id}
                     </button>
                   ))}
                 </div>
               </div>
               
               <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 focus-within:border-primary/50 transition-all font-mono">
                 <span className="text-white/20 text-2xl">/</span>
                 <input value={pattern} onChange={(e) => setPattern(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-white selection:bg-primary/30" placeholder="regex pattern here..." spellCheck={false} />
                 <span className="text-white/20 text-2xl">/</span>
                 <span className="text-primary font-bold">{flags}</span>
               </div>

               {error && (
                 <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                   <AlertCircle className="w-4 h-4" /> <p>{error}</p>
                 </div>
               )}

               {mode === "replace" && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Replacement</label>
                    <input value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="Replacement text..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-emerald-400" />
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input</label>
                 <textarea value={testString} onChange={(e) => setTestString(e.target.value)} className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-[11px] outline-none focus:border-primary/50 resize-none transition-all text-white/80" spellCheck={false} placeholder="Paste text here..." />
               </div>

               <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{mode === "test" ? "Matches" : "Replaced"}</label>
                 <div className="w-full h-80 bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-[11px] overflow-auto custom-scrollbar relative">
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {mode === "test" ? highlightedText.map((chunk, i) => (
                        <span key={i} className={cn(chunk.isMatch ? "bg-primary/30 text-primary-foreground rounded ring-1 ring-primary/40 px-0.5 mx-[1px]" : "text-white/40")}>{chunk.text}</span>
                      )) : <span className="text-emerald-400/80">{replacedText}</span>}
                    </div>
                    <button onClick={() => copy(mode === "test" ? testString : replacedText)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg">
                      {copiedId === 'main' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
               </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
              <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-sky-400" /> <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analysis</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {explanation.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-mono text-primary font-black text-sm">{item.token}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
              <div className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Presets</span></div>
              <div className="space-y-2">
                {COMMON_PATTERNS.map(p => (
                  <button key={p.label} onClick={() => { setPattern(p.value); setFlags(p.flags); toast.success(`Applied: ${p.label}`); }} className="w-full text-left p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                    <div className="flex items-center justify-between"><span className="text-xs font-bold text-white group-hover:text-primary">{p.label}</span> <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" /></div>
                    <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tight line-clamp-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {mode === "test" && (
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-500" /> <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Groups</span></div>
                   <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{matches.length} matches</span>
                </div>
                <div className="overflow-auto custom-scrollbar space-y-4 max-h-[500px] pr-2">
                  {matches.map((m, i) => (
                    <div key={i} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between"><span className="text-[10px] font-black text-primary uppercase">Match {i+1}</span> <button onClick={() => copy(m[0], `match-${i}`)} className="p-1 hover:text-white">{copiedId === `match-${i}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button></div>
                      <p className="font-mono text-[10px] text-white/80 break-all leading-relaxed">{m[0]}</p>
                      {(m.groups || m.length > 1) && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                           {m.groups && Object.entries(m.groups).map(([name, val]) => (
                             <div key={name} className="flex flex-col gap-0.5">
                               <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">{name}</span>
                               <span className="text-[10px] font-mono text-emerald-400 break-all bg-emerald-500/5 p-1.5 rounded-lg border border-emerald-500/10">{val || "null"}</span>
                             </div>
                           ))}
                           {!m.groups && Array.from(m).slice(1).map((g, gi) => (
                             <div key={gi} className="flex gap-2 text-[10px] font-mono">
                               <span className="text-white/30">{gi+1}:</span> <span className="text-blue-400 break-all">{g || "null"}</span>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {matches.length === 0 && <div className="py-20 text-center text-white/10 uppercase font-black text-[10px] tracking-widest">No matches found</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
