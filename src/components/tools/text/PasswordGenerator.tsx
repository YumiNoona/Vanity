import React, { useState, useEffect, useCallback } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { KeyRound, RefreshCw, Copy, CheckCircle, ShieldAlert, ShieldCheck, Shield, List, Type, Fingerprint, Download } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PasswordMode = "random" | "passphrase" | "pronounceable"

const WORDS = [
  "correct", "horse", "battery", "staple", "mountain", "river", "ocean", "forest",
  "cloud", "sunset", "whisper", "thunder", "quantum", "galaxy", "starlight", "nebula",
  "crystal", "diamond", "emerald", "sapphire", "phoenix", "dragon", "falcon", "eagle"
]

const VOWELS = "aeiou"
const CONSONANTS = "bcdfghjklmnpqrstvwxyz"

export function PasswordGenerator() {
  const [mode, setMode] = useState<PasswordMode>("random")
  const [password, setPassword] = useState("")
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([])
  const [isBulk, setIsBulk] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  
  // Random Settings
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNums, setUseNums] = useState(true)
  const [useSyms, setUseSyms] = useState(true)
  
  // Passphrase Settings
  const [wordCount, setWordCount] = useState(4)
  const [separator, setSeparator] = useState("-")
  
  const [copied, setCopied] = useState(false)

  const generateSingle = useCallback(() => {
    let result = ""
    if (mode === "random") {
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      const lower = "abcdefghijklmnopqrstuvwxyz"
      const nums = "0123456789"
      const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-="
      let chars = ""
      if (useUpper) chars += upper
      if (useLower) chars += lower
      if (useNums) chars += nums
      if (useSyms) chars += syms
      if (!chars) chars = lower

      const array = new Uint32Array(length)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
    } else if (mode === "passphrase") {
      const parts = []
      const array = new Uint32Array(wordCount)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < wordCount; i++) {
        parts.push(WORDS[array[i] % WORDS.length])
      }
      result = parts.join(separator)
    } else {
      // Pronounceable
      const array = new Uint32Array(length)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        const source = i % 2 === 0 ? CONSONANTS : VOWELS
        result += source[array[i] % source.length]
      }
    }
    return result
  }, [mode, length, useUpper, useLower, useNums, useSyms, wordCount, separator])

  const generate = useCallback(() => {
    if (isBulk) {
      const batch = Array.from({ length: bulkCount }).map(() => generateSingle())
      setBulkPasswords(batch)
      setPassword(batch[0])
    } else {
      setPassword(generateSingle())
    }
  }, [isBulk, bulkCount, generateSingle])

  useEffect(() => {
    generate()
  }, [generate])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  const downloadBulk = () => {
    const content = bulkPasswords.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `passwords-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate strong, secure, and memorable passwords locally using cryptographically strong APIs."
      icon={KeyRound}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Generation Mode</label>
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {[
                  { id: "random", icon: Fingerprint, label: "Random" },
                  { id: "passphrase", icon: List, label: "Phrase" },
                  { id: "pronounceable", icon: Type, label: "Speak" },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as PasswordMode)}
                    className={cn(
                      "py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-1",
                      mode === m.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <m.icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {mode === "random" || mode === "pronounceable" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Length</label>
                    <span className="font-mono text-sm text-primary">{length}</span>
                  </div>
                  <input 
                    type="range" min="4" max="64" value={length} 
                    onChange={e => setLength(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  {mode === "random" && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {[
                        { label: "A-Z", state: useUpper, set: setUseUpper },
                        { label: "a-z", state: useLower, set: setUseLower },
                        { label: "0-9", state: useNums, set: setUseNums },
                        { label: "!@#", state: useSyms, set: setUseSyms },
                      ].map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => opt.set(!opt.state)}
                          className={cn(
                            "py-2 px-3 rounded-xl border text-[10px] font-bold transition-all",
                            opt.state ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Word Count</label>
                    <span className="font-mono text-sm text-primary">{wordCount}</span>
                  </div>
                  <input 
                    type="range" min="2" max="10" value={wordCount} 
                    onChange={e => setWordCount(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Separator</label>
                    <input 
                      type="text" value={separator} onChange={e => setSeparator(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-primary/50 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">Bulk Generation</span>
                <div 
                  onClick={() => setIsBulk(!isBulk)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    isBulk ? "bg-primary" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                    isBulk ? "left-6" : "left-1"
                  )} />
                </div>
              </label>
              {isBulk && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground">Count</span>
                    <span className="text-xs font-mono">{bulkCount}</span>
                  </div>
                  <input 
                    type="range" min="2" max="100" value={bulkCount} 
                    onChange={e => setBulkCount(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}
            </div>

            <button
              onClick={generate}
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-7 space-y-6">
          {isBulk ? (
            <div className="glass-panel rounded-3xl border border-white/5 bg-black/20 overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bulk Results</span>
                <button onClick={downloadBulk} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all">
                  <Download className="w-3 h-3" /> Download .txt
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-2 custom-scrollbar">
                {bulkPasswords.map((p, i) => (
                  <div key={i} className="group flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-primary/30 transition-all">
                    <span className="font-mono text-sm text-white/80">{p}</span>
                    <button onClick={() => handleCopy(p)} className="p-1.5 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center justify-center space-y-8 h-full min-h-[400px]">
               <div className="text-center space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Generated Password</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black text-white break-all max-w-md mx-auto">{password}</p>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => handleCopy(password)}
                    className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? "Copied!" : "Copy Password"}
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
