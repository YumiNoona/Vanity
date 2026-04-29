import React, { useState, useEffect, useCallback, useMemo } from "react"
import zxcvbn from "zxcvbn"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { KeyRound, RefreshCw, Copy, CheckCircle, ShieldAlert, ShieldCheck, Shield, List, Type, Fingerprint, Download, Lock, Unlock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { useDownload } from "@/hooks/useDownload"

type PasswordMode = "random" | "passphrase" | "pronounceable"

const WORDS = [
  "correct", "horse", "battery", "staple", "mountain", "river", "ocean", "forest",
  "cloud", "sunset", "whisper", "thunder", "quantum", "galaxy", "starlight", "nebula",
  "crystal", "diamond", "emerald", "sapphire", "phoenix", "dragon", "falcon", "eagle",
  "atlas", "beacon", "cipher", "delta", "echo", "flare", "glitch", "helix", "iron", "jade",
  "karma", "lunar", "matrix", "nova", "orbit", "pulse", "quartz", "radar", "solar", "titan",
  "ultra", "vector", "wave", "xenon", "yield", "zenith", "alpha", "bravo", "charlie"
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
  const [capitalize, setCapitalize] = useState(false)

  const { copiedId, copy } = useCopyToClipboard()
  const { download } = useDownload()

  const downloadBulk = () => {
    const content = bulkPasswords.join("\n")
    download(content, "passwords.txt")
    toast.success("Batch downloaded")
  }

  const zxcvbnResult = useMemo(() => {
    if (!password) return null
    return zxcvbn(password)
  }, [password])

  const strength = zxcvbnResult?.score ?? 0
  const strengthLabel = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength]
  const strengthColor = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-400", "bg-blue-500"][strength]
  const timeToCrack = zxcvbnResult?.crack_times_display.offline_fast_hashing_1e10_per_second ?? ""

  const generateSingle = useCallback(() => {
    let result = ""
    const array = new Uint32Array(64)
    window.crypto.getRandomValues(array)
    let ai = 0

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

      for (let i = 0; i < length; i++) {
        result += chars[array[ai++] % chars.length]
      }
    } else if (mode === "passphrase") {
      const parts = []
      for (let i = 0; i < wordCount; i++) {
        let w = WORDS[array[ai++] % WORDS.length]
        if (capitalize) w = w.charAt(0).toUpperCase() + w.slice(1)
        parts.push(w)
      }
      result = parts.join(separator)
    } else {
      for (let i = 0; i < length; i++) {
        const source = i % 2 === 0 ? CONSONANTS : VOWELS
        result += source[array[ai++] % source.length]
      }
    }
    return result
  }, [mode, length, useUpper, useLower, useNums, useSyms, wordCount, separator, capitalize])

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
  }, [mode, length, useUpper, useLower, useNums, useSyms, wordCount, separator, capitalize, isBulk, bulkCount])

  return (
    <ToolLayout
      title="Password Generator"
      description="Cryptographically secure password and passphrase generation."
      icon={KeyRound}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        {/* Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <PillToggle
              activeId={mode}
              onChange={(id) => setMode(id as PasswordMode)}
              options={[
                { id: "random", label: "Random", icon: Fingerprint },
                { id: "passphrase", label: "Phrase", icon: List },
                { id: "pronounceable", label: "Speak", icon: Type },
              ]}
            />

            <div className="space-y-6">
              {mode === "passphrase" ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Word Count</label>
                      <span className="text-xs font-mono text-primary">{wordCount}</span>
                    </div>
                    <input type="range" min="2" max="12" value={wordCount} onChange={e => setWordCount(parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Separator</label>
                    <input value={separator} onChange={e => setSeparator(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-center outline-none focus:border-primary/50" />
                  </div>
                  <button 
                    onClick={() => setCapitalize(!capitalize)}
                    className={cn(
                      "w-full py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                      capitalize ? "bg-primary/10 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                    )}
                  >
                    Capitalize Words: {capitalize ? "ON" : "OFF"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Length</label>
                      <span className="text-xs font-mono text-primary">{length}</span>
                    </div>
                    <input type="range" min="4" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                  {mode === "random" && (
                    <div className="grid grid-cols-2 gap-2">
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
                            "py-2 rounded-lg text-[10px] font-black border transition-all",
                            opt.state ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/5 text-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
               <button 
                 onClick={() => setIsBulk(!isBulk)}
                 className={cn(
                   "w-full py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                   isBulk ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-muted-foreground"
                 )}
               >
                 Batch Generation: {isBulk ? "ON" : "OFF"}
               </button>
               {isBulk && (
                 <div className="flex items-center gap-4 animate-in slide-in-from-top-2">
                    <input type="number" value={bulkCount} onChange={e => setBulkCount(parseInt(e.target.value) || 1)} className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center text-xs font-mono outline-none" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Passwords</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
              <div className="relative group">
                 <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 font-mono text-2xl text-white text-center break-all min-h-[120px] flex items-center justify-center">
                    {password}
                 </div>
                 <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={generate} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-primary transition-all">
                       <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={() => copy(password, 'single')} className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-all">
                       {copiedId === 'single' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>

              {/* Strength Meter */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Strength</span>
                    <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", strengthColor.replace('bg-', 'text-'))}>{strengthLabel}</span>
                 </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={cn("h-full flex-1 transition-all duration-500", i <= strength ? strengthColor : "bg-white/5")} />
                    ))}
                  </div>
                  {timeToCrack && (
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center mt-2">
                      Est. Crack Time: <span className="text-white font-bold">{timeToCrack}</span>
                    </p>
                  )}
               </div>

              {isBulk && (
                <div className="space-y-4 pt-8 border-t border-white/5 animate-in fade-in">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bulk Results ({bulkPasswords.length})</label>
                      <button onClick={downloadBulk} className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-all">
                         <Download className="w-3.5 h-3.5" /> Download .txt
                      </button>
                   </div>
                   <div className="p-4 bg-black/40 rounded-2xl border border-white/5 max-h-[300px] overflow-auto custom-scrollbar font-mono text-xs text-muted-foreground space-y-2">
                      {bulkPasswords.map((p, i) => (
                        <div key={i} className="flex items-center justify-between group py-1 border-b border-white/[0.02]">
                           <span>{p}</span>
                           <button onClick={() => copy(p, `bulk-${i}`)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all">
                              {copiedId === `bulk-${i}` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
              <div className="space-y-1">
                 <h4 className="text-sm font-bold text-white uppercase tracking-tighter">100% Local Entropy</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                   Passwords are generated using <strong>window.crypto.getRandomValues()</strong>, providing high-quality entropy directly on your machine. Nothing is ever sent to any server.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
