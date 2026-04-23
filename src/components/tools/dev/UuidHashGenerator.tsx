import React, { useState, useCallback } from "react"
import { ArrowLeft, Key, Copy, CheckCircle, RefreshCw, ShieldCheck, Hash } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"

export function UuidHashGenerator() {
  const [uuid, setUuid] = useState(crypto.randomUUID())
  const [inputText, setInputText] = useState("")
  const [hashResult, setHashResult] = useState({ sha256: "", sha512: "" })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const generateUuid = () => {
    setUuid(crypto.randomUUID())
    toast.success("New UUID generated")
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const calculateHash = useCallback(async (text: string) => {
    if (!text) {
      setHashResult({ sha256: "", sha512: "" })
      return
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(text)

    // SHA-256
    const hashBuffer256 = await crypto.subtle.digest("SHA-256", data)
    const hashArray256 = Array.from(new Uint8Array(hashBuffer256))
    const hashHex256 = hashArray256.map(b => b.toString(16).padStart(2, "0")).join("")

    // SHA-512
    const hashBuffer512 = await crypto.subtle.digest("SHA-512", data)
    const hashArray512 = Array.from(new Uint8Array(hashBuffer512))
    const hashHex512 = hashArray512.map(b => b.toString(16).padStart(2, "0")).join("")

    setHashResult({ sha256: hashHex256, sha512: hashHex512 })
  }, [])

  const onInputChange = (val: string) => {
    setInputText(val)
    calculateHash(val)
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <ToolLayout 
      title="Security Toolbox" 
      description="Generate secure UUIDs and cryptographic hashes locally." 
      icon={Key} 
      onBack={handleBack} 
      backLabel="Back" 
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* UUID Generator */}
        <div className="glass-panel p-8 rounded-3xl space-y-6 flex flex-col justify-between">
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    UUID v4 Generator
                 </label>
                 <ShieldCheck className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-sm break-all text-blue-400 select-all tracking-wider text-center">
                 {uuid}
              </div>
           </div>
           
           <div className="flex gap-3 pt-4">
              <button 
                onClick={generateUuid}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
              <button 
                onClick={() => handleCopy(uuid, 'uuid')}
                className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                {copiedId === 'uuid' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy Result
              </button>
           </div>
        </div>

        {/* Cryptographic Hash */}
        <div className="glass-panel p-8 rounded-3xl space-y-6">
           <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 Compute Hash (SHA)
              </label>
              <textarea 
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Enter string to hash..."
                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-sm outline-none focus:border-blue-500/30 transition-all text-white/90"
              />
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                 <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                    <span>SHA-256</span>
                    <button onClick={() => handleCopy(hashResult.sha256, '256')} className="hover:text-blue-500 transition-colors">
                       <Copy className="w-3 h-3" />
                    </button>
                 </div>
                 <div className="p-3 bg-white/5 rounded-lg border border-white/5 font-mono text-[10px] break-all text-muted-foreground">
                    {hashResult.sha256 || "—"}
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                    <span>SHA-512</span>
                    <button onClick={() => handleCopy(hashResult.sha512, '512')} className="hover:text-blue-500 transition-colors">
                       <Copy className="w-3 h-3" />
                    </button>
                 </div>
                 <div className="p-3 bg-white/5 rounded-lg border border-white/5 font-mono text-[10px] break-all text-muted-foreground">
                    {hashResult.sha512 || "—"}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4 mt-8">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 shrink-0">
           <Hash className="w-5 h-5" />
        </div>
        <div className="space-y-1">
           <h4 className="text-sm font-bold text-white">How it works</h4>
           <p className="text-xs text-muted-foreground leading-relaxed">
             This tool uses the native <strong>Web Crypto API</strong> available in your browser. All computations happen locally on your CPU. No strings are ever transmitted over the network, making it safe for hashing sensitive tokens or keys.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
