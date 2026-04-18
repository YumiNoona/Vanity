import React, { useState, useEffect } from "react"
import { Binary, Asterisk, Hash, CircleDot, AlertTriangle } from "lucide-react"

export function NumberBaseConverter() {
  const [dec, setDec] = useState("")
  const [bin, setBin] = useState("")
  const [hex, setHex] = useState("")
  const [oct, setOct] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = (value: string, radix: number) => {
    // Clear all if empty
    if (!value.trim()) {
      setDec("")
      setBin("")
      setHex("")
      setOct("")
      setError(null)
      return
    }

    try {
      // Validate input constraints based on radix
      const cleanVal = value.trim()
      let isValid = true
      
      if (radix === 2 && !/^[01]+$/.test(cleanVal)) isValid = false
      if (radix === 8 && !/^[0-7]+$/.test(cleanVal)) isValid = false
      if (radix === 10 && !/^\d+$/.test(cleanVal)) isValid = false
      if (radix === 16 && !/^[0-9A-Fa-f]+$/.test(cleanVal)) isValid = false

      if (!isValid) {
        setError(`Invalid characters for Base ${radix}`)
        return
      }

      const num = BigInt(`0${radix === 2 ? 'b' : radix === 8 ? 'o' : radix === 16 ? 'x' : ''}${cleanVal}`)
      
      if (radix !== 10) setDec(num.toString(10))
      else setDec(cleanVal)

      if (radix !== 2) setBin(num.toString(2))
      else setBin(cleanVal)

      if (radix !== 16) setHex(num.toString(16).toUpperCase())
      else setHex(cleanVal.toUpperCase())

      if (radix !== 8) setOct(num.toString(8))
      else setOct(cleanVal)

      setError(null)
    } catch (e) {
      setError("Number exceeds processing limits or is invalid")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 px-4 sm:px-0 mb-8">
        <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
           <Hash className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-syne">Number Base Converter</h1>
          <p className="text-muted-foreground text-sm">Convert between binary, octal, decimal, and hexadecimal instantly.</p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl mx-4 sm:mx-0 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 border border-red-500/20 text-sm rounded-xl">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="space-y-4 relative group">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <Asterisk className="w-4 h-4" /> Decimal <span className="text-[10px] text-muted-foreground opacity-50 ml-2">Base 10</span>
          </label>
          <input 
            type="text"
            value={dec}
            placeholder="e.g. 1024"
            onChange={(e) => handleUpdate(e.target.value, 10)}
            className="w-full bg-black/40 border border-white/10 focus:border-red-500/50 rounded-xl p-6 font-mono text-xl sm:text-2xl text-white outline-none transition-colors"
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Binary className="w-4 h-4" /> Binary <span className="text-[10px] text-muted-foreground opacity-50 ml-2">Base 2</span>
          </label>
          <textarea 
            value={bin}
            placeholder="e.g. 10000000000"
            onChange={(e) => handleUpdate(e.target.value, 2)}
            className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl p-6 font-mono text-xl sm:text-2xl text-emerald-100 outline-none transition-colors resize-y min-h-[100px] break-all"
            spellCheck={false}
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
            <Hash className="w-4 h-4" /> Hexadecimal <span className="text-[10px] text-muted-foreground opacity-50 ml-2">Base 16</span>
          </label>
          <input 
            type="text"
            value={hex}
            placeholder="e.g. 400"
            onChange={(e) => handleUpdate(e.target.value, 16)}
            className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl p-6 font-mono text-xl sm:text-2xl text-purple-100 outline-none transition-colors uppercase"
            spellCheck={false}
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-2">
            <CircleDot className="w-4 h-4" /> Octal <span className="text-[10px] text-muted-foreground opacity-50 ml-2">Base 8</span>
          </label>
          <input 
            type="text"
            value={oct}
            placeholder="e.g. 2000"
            onChange={(e) => handleUpdate(e.target.value, 8)}
            className="w-full bg-black/40 border border-white/10 focus:border-sky-500/50 rounded-xl p-6 font-mono text-xl sm:text-2xl text-sky-100 outline-none transition-colors"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
