import React, { useState, useEffect } from "react"
import { KeyRound, RefreshCcw, Copy, CheckCircle, ShieldAlert, ShieldCheck, Shield } from "lucide-react"

export function PasswordGenerator() {
  const [password, setPassword] = useState("")
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNums, setUseNums] = useState(true)
  const [useSyms, setUseSyms] = useState(true)
  const [copied, setCopied] = useState(false)
  
  const generate = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lower = "abcdefghijklmnopqrstuvwxyz"
    const nums = "0123456789"
    const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-="
    
    let chars = ""
    if (useUpper) chars += upper
    if (useLower) chars += lower
    if (useNums) chars += nums
    if (useSyms) chars += syms
    
    // Fallback if user unchecks all
    if (!chars) {
      chars = lower
      setUseLower(true)
    }

    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array)
    
    let result = ""
    for (let i = 0; i < length; i++) {
       result += chars[array[i] % chars.length]
    }
    setPassword(result)
  }

  // Calculate Entropy (bits = L * log2(R)) where R is pool size
  let poolSize = 0
  if (useUpper) poolSize += 26
  if (useLower) poolSize += 26
  if (useNums) poolSize += 10
  if (useSyms) poolSize += 29
  
  if (poolSize === 0) poolSize = 26
  const entropy = Math.floor(length * Math.log2(poolSize))
  
  let entropyStatus = "Weak"
  let EntropyIcon = ShieldAlert
  let entropyColor = "text-red-400"
  
  if (entropy > 100) {
    entropyStatus = "Very Strong"
    EntropyIcon = ShieldCheck
    entropyColor = "text-emerald-400"
  } else if (entropy > 75) {
    entropyStatus = "Strong"
    EntropyIcon = Shield
    entropyColor = "text-green-400"
  } else if (entropy > 50) {
    entropyStatus = "Moderate"
    EntropyIcon = Shield
    entropyColor = "text-amber-400"
  }

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUpper, useLower, useNums, useSyms])

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 px-4 sm:px-0 mb-8">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
           <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-syne">Password Generator</h1>
          <p className="text-muted-foreground text-sm">Generate secure, random passwords locally using cryptographically strong APIs.</p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl mx-4 sm:mx-0 space-y-8">
        <div className="relative group">
           <textarea
             readOnly
             value={password}
             className="w-full bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-xl sm:text-2xl lg:text-3xl text-center text-white outline-none resize-none break-all flex items-center justify-center min-h-[120px]"
             spellCheck={false}
           />
           <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={generate}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                title="Regenerate"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={handleCopy}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 font-bold text-xs transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Length</label>
                   <span className="text-xl font-black text-emerald-400">{length}</span>
                 </div>
                 <input 
                   type="range"
                   min="4"
                   max="128"
                   value={length}
                   onChange={(e) => setLength(parseInt(e.target.value))}
                   className="w-full accent-emerald-500"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-4">Characters</label>
                 
                 <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                   <span className="text-sm font-bold">Uppercase (A-Z)</span>
                   <input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                 </label>
                 <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                   <span className="text-sm font-bold">Lowercase (a-z)</span>
                   <input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                 </label>
                 <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                   <span className="text-sm font-bold">Numbers (0-9)</span>
                   <input type="checkbox" checked={useNums} onChange={e => setUseNums(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                 </label>
                 <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                   <span className="text-sm font-bold">Symbols (!@#)</span>
                   <input type="checkbox" checked={useSyms} onChange={e => setUseSyms(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                 </label>
              </div>
           </div>

           <div className="bg-black/30 border border-white/5 rounded-2xl p-6 h-fit space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security Math</label>
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                 <span className="text-sm">Information Entropy</span>
                 <span className="font-mono text-lg font-bold">{entropy} bits</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                 <span className="text-sm">Pool Size</span>
                 <span className="font-mono">{poolSize} chars</span>
              </div>
              <div className="pt-4 flex items-center gap-3">
                 <div className={`p-3 rounded-full bg-white/5 ${entropyColor}`}>
                    <EntropyIcon className="w-8 h-8" />
                 </div>
                 <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Status</div>
                    <div className={`text-2xl font-black uppercase ${entropyColor}`}>{entropyStatus}</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
