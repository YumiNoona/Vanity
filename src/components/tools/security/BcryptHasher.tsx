import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Fingerprint, ShieldCheck, Copy, CheckCircle, RefreshCw, Key, Info, Lock, Unlock } from "lucide-react"

import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function BcryptHasher() {
  const [input, setInput] = useState("")
  const [hash, setHash] = useState("")
  const [rounds, setRounds] = useState(10)
  const [verifyInput, setVerifyInput] = useState("")
  const [verifyHash, setVerifyHash] = useState("")
  const [isMatch, setIsMatch] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  const handleHash = async () => {
    if (!input) return
    try {
      const bcrypt = (await import("bcryptjs")).default
      const salt = bcrypt.genSaltSync(rounds)
      const newHash = bcrypt.hashSync(input, salt)
      setHash(newHash)
      toast.success("Bcrypt hash generated")
    } catch (e) {
      toast.error("Hashing failed")
    }
  }

  const handleVerify = async () => {
    if (!verifyInput || !verifyHash) return
    try {
      const bcrypt = (await import("bcryptjs")).default
      const match = bcrypt.compareSync(verifyInput, verifyHash)
      setIsMatch(match)
      if (match) toast.success("Hashes match!")
      else toast.error("Hashes do not match")
    } catch (e) {
      toast.error("Verification failed (invalid hash format?)")
    }
  }

  return (
    <ToolLayout
      title="Bcrypt Hasher"
      description="Securely hash passwords and verify existing bcrypt hashes locally using the blowfish cipher."
      icon={Fingerprint}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hashing Panel */}
        <div className="space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
              <div className="flex items-center gap-2 text-primary mb-2">
                 <Lock className="w-4 h-4" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Generate Hash</h3>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input String</label>
                 <input 
                   type="text" value={input} onChange={e => setInput(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono focus:border-primary/50 outline-none"
                   placeholder="Enter text to hash..."
                 />
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Salt Rounds</label>
                    <span className="text-xs font-mono text-primary">{rounds}</span>
                 </div>
                 <input 
                   type="range" min="4" max="15" value={rounds} onChange={e => setRounds(parseInt(e.target.value))}
                   className="w-full accent-primary"
                 />
              </div>
              <button 
                onClick={handleHash}
                className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                 <RefreshCw className="w-4 h-4" /> Generate Hash
              </button>
              {hash && (
                <div className="pt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bcrypt Hash</label>
                      <button onClick={() => { navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-primary hover:text-white transition-colors">
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                   <p className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] break-all leading-relaxed text-white/80">{hash}</p>
                </div>
              )}
           </div>
        </div>

        {/* Verification Panel */}
        <div className="space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
              <div className="flex items-center gap-2 text-accent mb-2">
                 <Unlock className="w-4 h-4" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Verify Hash</h3>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original String</label>
                 <input 
                   type="text" value={verifyInput} onChange={e => setVerifyInput(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono focus:border-accent/50 outline-none"
                   placeholder="Enter original text..."
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bcrypt Hash to Compare</label>
                 <textarea 
                   value={verifyHash} onChange={e => setVerifyHash(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-mono focus:border-accent/50 outline-none h-24 resize-none"
                   placeholder="$2a$10$..."
                 />
              </div>
              <button 
                onClick={handleVerify}
                className="w-full h-12 bg-accent text-accent-foreground font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
              >
                 <ShieldCheck className="w-4 h-4" /> Verify Match
              </button>
              {isMatch !== null && (
                <div className={cn(
                  "p-4 rounded-xl border flex items-center justify-center gap-3 animate-in zoom-in-95",
                  isMatch ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                )}>
                   {isMatch ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                   <span className="text-xs font-black uppercase tracking-widest">{isMatch ? "Valid Match" : "Hash Mismatch"}</span>
                </div>
              )}
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
