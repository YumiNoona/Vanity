import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { ShieldCheck, Download, Copy, CheckCircle, Loader2, RefreshCw, Key, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AnimatedTabs } from "@/components/shared/AnimatedTabs"

export function RsaGen() {
  const [keys, setKeys] = useState<{ public: string; private: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [bitSize, setBitSize] = useState(2048)
  const [copied, setCopied] = useState<"pub" | "priv" | null>(null)

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = ""
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  const formatPem = (label: string, base64: string) => {
    const lines = base64.match(/.{1,64}/g) || []
    return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`
  }

  const generate = async () => {
    setIsGenerating(true)
    setKeys(null)
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSASSA-PKCS1-v1_5",
          modulusLength: bitSize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      )

      const pub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
      const priv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)

      setKeys({
        public: formatPem("PUBLIC KEY", arrayBufferToBase64(pub)),
        private: formatPem("PRIVATE KEY", arrayBufferToBase64(priv)),
      })
      toast.success("RSA Key Pair Generated")
    } catch (error) {
      toast.error("Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string, type: "pub" | "priv") => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
    toast.success(`${type === "pub" ? "Public" : "Private"} key copied`)
  }

  return (
    <ToolLayout
      title="RSA Key Generator"
      description="Generate cryptographically strong RSA public and private key pairs locally in your browser."
      icon={ShieldCheck}
    >
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-wrap gap-6 items-center justify-between">
           <div className="flex items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bit Size</label>
              <AnimatedTabs
                 tabs={[
                   { id: 1024, label: "1024" },
                   { id: 2048, label: "2048" },
                   { id: 4096, label: "4096" }
                 ]}
                 activeTab={bitSize}
                 onChange={setBitSize}
                 layoutId="rsaBitSize"
              />
           </div>
           
           <button 
             onClick={generate}
             disabled={isGenerating}
             className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
           >
             {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
             Generate Key Pair
           </button>
        </div>

        {keys && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Public Key (SPKI)</label>
                   <button onClick={() => handleCopy(keys.public, "pub")} className="text-primary hover:text-primary/80 transition-colors">
                      {copied === "pub" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
                <textarea 
                   readOnly 
                   value={keys.public}
                   className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] h-[300px] resize-none outline-none focus:border-primary/30 transition-all text-white/70"
                />
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Private Key (PKCS#8)</label>
                   <button onClick={() => handleCopy(keys.private, "priv")} className="text-red-400 hover:text-red-300 transition-colors">
                      {copied === "priv" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
                <textarea 
                   readOnly 
                   value={keys.private}
                   className="w-full bg-black/40 border border-red-500/5 rounded-2xl p-6 font-mono text-[10px] h-[300px] resize-none outline-none focus:border-red-500/20 transition-all text-white/70"
                />
             </div>
          </div>
        )}

        {!keys && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4 opacity-50">
             <Key className="w-16 h-16" />
             <p className="text-sm">Click generate to create a new RSA key pair.</p>
          </div>
        )}

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 mt-8">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             RSA Key Generation uses the native <code>SubtleCrypto</code> API. Your keys are generated entirely in your browser's secure context and are never sent to any server. 4096-bit keys are highly secure but may take a few seconds to generate.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
