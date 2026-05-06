import React, { useState, useEffect } from "react"
import { Share2, Link as LinkIcon, CheckCircle, Copy, Lock, Unlock, FileUp, Shield, ShieldCheck, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function Pastebin() {
  const [content, setContent] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const { isCopied, copy } = useCopyToClipboard()

  // Load from URL on mount
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      if (hash) {
        // If it looks like encrypted (e.g., contains specific prefix or just try-catch)
        if (hash.startsWith("enc:")) {
          setIsLocked(true)
        } else {
          decodeContent(hash)
        }
      }
    }
  }, [])

  const decodeContent = async (hash: string, pass?: string) => {
    try {
      const { default: LZString } = await import("lz-string")
      let raw = hash
      
      if (hash.startsWith("enc:")) {
        if (!pass) return
        const CryptoJS = (await import("crypto-js")).default
        const encrypted = hash.substring(4)
        try {
          const bytes = CryptoJS.AES.decrypt(encrypted, pass)
          raw = bytes.toString(CryptoJS.enc.Utf8)
          if (!raw) throw new Error("Invalid password")
        } catch (e) {
          toast.error("Decryption failed. Check your password.")
          return
        }
      }

      const decompressed = LZString.decompressFromEncodedURIComponent(raw)
      if (decompressed) {
        setContent(decompressed)
        setIsLocked(false)
        if (pass) setPassword(pass)
      }
    } catch (e) {
      toast.error("Failed to decode content")
    }
  }

  const generateShareLink = async () => {
    if (!content.trim()) return

    try {
      const { default: LZString } = await import("lz-string")
      const compressed = LZString.compressToEncodedURIComponent(content)
      let finalHash = compressed

      if (password) {
        const CryptoJS = (await import("crypto-js")).default
        const encrypted = CryptoJS.AES.encrypt(compressed, password).toString()
        finalHash = `enc:${encrypted}`
      }

      const newUrl = `${window.location.pathname}${window.location.search}#${finalHash}`
      window.history.replaceState(null, "", newUrl)
      setShareUrl(window.location.origin + newUrl)
      setIsEncrypted(!!password)
      toast.success(password ? "Encrypted link generated!" : "Share link generated!")
    } catch (e) {
      toast.error("Generation failed")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 500) { // 500KB limit for URL-based storage
       toast.error("File too large. URL-based pastebin is limited to ~500KB.")
       return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setContent(ev.target?.result as string)
      toast.success(`Loaded ${file.name}`)
    }
    reader.readAsText(file)
  }

  const handleUnlock = () => {
    const hash = window.location.hash.substring(1)
    decodeContent(hash, password)
  }

  return (
    <ToolLayout title="Serverless Pastebin" description="Share text snippets securely via URL. Zero server storage." icon={Share2} centered={true} maxWidth="max-w-6xl">
      <div className="space-y-6">
        
        {isLocked ? (
          <div className="glass-panel p-12 rounded-[2.5rem] border border-primary/20 bg-primary/5 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95">
             <div className="p-6 bg-primary/10 rounded-full">
               <Lock className="w-12 h-12 text-primary" />
             </div>
             <div className="text-center space-y-2">
               <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">This Link is Encrypted</h3>
               <p className="text-sm text-muted-foreground">Enter the password provided by the sender to decrypt the content.</p>
             </div>
             <div className="w-full max-w-sm space-y-4">
                <input 
                  type="password" 
                  placeholder="Enter Password..." 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-white outline-none focus:border-primary/50 transition-all font-mono"
                />
                <button 
                  onClick={handleUnlock}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Decrypt & Unlock
                </button>
             </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="glass-panel rounded-[2rem] border border-white/5 bg-black/20 overflow-hidden relative group">
                  <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content</span>
                      <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-mono text-muted-foreground">{content.length} characters</span>
                    </div>
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all group/up">
                       <FileUp className="w-3 h-3 group-hover/up:-translate-y-0.5 transition-transform" />
                       <span className="text-[10px] font-bold uppercase">Upload File</span>
                       <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.js,.ts,.json,.md,.css,.html" />
                    </label>
                  </div>
                  <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full h-[500px] bg-transparent p-8 font-mono text-sm resize-none outline-none focus:border-primary/50 transition-all custom-scrollbar text-white/90"
                    placeholder="Paste your text or code here..."
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-black/20 space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Layer</label>
                        {password ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Shield className="w-4 h-4 text-white/20" />}
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Link Password (Optional)" 
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary/50 transition-all font-mono"
                        />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Setting a password enables client-side AES encryption. The content is encrypted before being added to the URL.
                      </p>
                   </div>

                   <button 
                     onClick={generateShareLink}
                     disabled={!content.trim()}
                     className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-30"
                   >
                     <Share2 className="w-4 h-4" /> Generate Link
                   </button>
                </div>

                {shareUrl && (
                  <div className="glass-panel p-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 space-y-4 animate-in slide-in-from-top-4">
                     <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Shareable Link Ready</span>
                     </div>
                     <div className="bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-[10px] text-emerald-300/80 break-all line-clamp-3">
                        {shareUrl}
                     </div>
                     <button 
                       onClick={() => copy(shareUrl, "share")}
                       className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                     >
                       {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                       {isCopied ? "Copied" : "Copy Secure Link"}
                     </button>
                  </div>
                )}
                
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                   <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                   <p className="text-[9px] text-amber-500/80 leading-relaxed uppercase font-bold tracking-tighter">
                     Warning: URL length limit (~2000 chars) applies. Large snippets will fail to load in some browsers.
                   </p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </ToolLayout>
  )
}
