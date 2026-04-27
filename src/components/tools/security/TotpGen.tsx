import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { KeyRound, ShieldCheck, Copy, CheckCircle, Clock, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function TotpGen() {
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP")
  const [token, setToken] = useState("------")
  const [timeLeft, setTimeLeft] = useState(30)
  const [copied, setCopied] = useState(false)

  const base32ToBytes = (base32: string) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanSecret = base32.replace(/\s/g, '').toUpperCase();
    const bytes = new Uint8Array(Math.floor((cleanSecret.length * 5) / 8));
    let bits = 0;
    let value = 0;
    let index = 0;
    for (let i = 0; i < cleanSecret.length; i++) {
      const idx = alphabet.indexOf(cleanSecret[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        if (index < bytes.length) {
          bytes[index++] = (value >> (bits - 8)) & 0xff;
        }
        bits -= 8;
      }
    }
    return bytes;
  };

  const generateToken = async (s: string) => {
    try {
      if (!s.trim()) return "------"
      const keyBytes = base32ToBytes(s)
      const epoch = Math.floor(Date.now() / 1000)
      const counter = Math.floor(epoch / 30)
      
      const buffer = new ArrayBuffer(8)
      const view = new DataView(buffer)
      // High 32 bits (zero for now as we're well within range)
      view.setUint32(0, 0, false)
      // Low 32 bits
      view.setUint32(4, counter, false)

      const cryptoKey = await crypto.subtle.importKey(
        'raw', 
        keyBytes, 
        { name: 'HMAC', hash: 'SHA-1' }, 
        false, 
        ['sign']
      )
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer)
      const hmac = new Uint8Array(signature)
      const offset = hmac[hmac.length - 1] & 0x0f
      const otp = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000
      
      return otp.toString().padStart(6, '0')
    } catch (e) {
      return "ERROR"
    }
  }

  useEffect(() => {
    const update = async () => {
      const newToken = await generateToken(secret)
      setToken(newToken)
      const currentSeconds = Math.floor(Date.now() / 1000)
      setTimeLeft(30 - (currentSeconds % 30))
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [secret])

  const handleCopy = () => {
    if (token === "------" || token === "ERROR") return
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Token copied")
  }

  return (
    <ToolLayout
      title="TOTP Generator"
      description="Generate 6-digit 2FA authentication codes locally using native browser SubtleCrypto. No external libraries."
      icon={KeyRound}
      centered={true}
    >
      <div className="max-w-xl mx-auto space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8 text-center">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current 2FA Token</label>
              <div className="flex items-center justify-center gap-6">
                 <p className="text-7xl font-mono font-black text-white tracking-widest">{token}</p>
                 <button 
                   onClick={handleCopy}
                   className={cn(
                     "p-3 rounded-2xl transition-all",
                     copied ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                   )}
                 >
                   {copied ? <CheckCircle className="w-8 h-8" /> : <Copy className="w-8 h-8" />}
                 </button>
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                 <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Token Expires in
                 </span>
                 <span className="font-mono">{timeLeft}s</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <div 
                   className={cn(
                     "h-full transition-all duration-1000",
                     timeLeft < 10 ? "bg-red-500" : "bg-primary"
                   )}
                   style={{ width: `${(timeLeft / 30) * 100}%` }}
                 />
              </div>
           </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-4">
           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secret Key (Base32)</label>
           <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                 type="text" 
                 value={secret} 
                 onChange={e => setSecret(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-mono focus:border-primary/50 outline-none transition-all"
                 placeholder="JBSWY3DPEHPK3PXP"
              />
           </div>
        </div>

        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-emerald-500 shrink-0" />
           <p className="text-sm text-emerald-500/80 leading-relaxed">
             This tool uses the <code>SubtleCrypto</code> API for high-performance, zero-dependency token generation. Everything is local.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
