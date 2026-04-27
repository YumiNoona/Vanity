import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { DropZone } from "@/components/shared/DropZone"
import { ShieldCheck, FileCheck, Search, Loader2, Copy, CheckCircle, AlertCircle, FileText, Fingerprint } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ChecksumVerify() {
  const [file, setFile] = useState<File | null>(null)
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [expectedHash, setExpectedHash] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const calculateHashes = async (f: File) => {
    setIsProcessing(true)
    const newHashes: Record<string, string> = {}
    
    try {
      const buffer = await f.arrayBuffer()
      
      // SHA-256
      const sha256Buffer = await crypto.subtle.digest("SHA-256", buffer)
      newHashes["SHA-256"] = Array.from(new Uint8Array(sha256Buffer)).map(b => b.toString(16).padStart(2, "0")).join("")
      
      // SHA-1
      const sha1Buffer = await crypto.subtle.digest("SHA-1", buffer)
      newHashes["SHA-1"] = Array.from(new Uint8Array(sha1Buffer)).map(b => b.toString(16).padStart(2, "0")).join("")

      setHashes(newHashes)
    } catch (err) {
      toast.error("Failed to calculate checksums")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      calculateHashes(files[0])
    }
  }

  const getMatchStatus = (hash: string) => {
    if (!expectedHash) return null
    return hash.toLowerCase() === expectedHash.toLowerCase().trim()
  }

  return (
    <ToolLayout
      title="Checksum Verifier"
      description="Verify file integrity and authenticity by calculating cryptographic hashes locally."
      icon={Fingerprint}
      centered={true}
      maxWidth="max-w-4xl"
    >
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        {!file ? (
          <DropZone onDrop={handleDrop} label="Drop file to calculate checksums" />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                     <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                       {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
               </div>
               <button onClick={() => { setFile(null); setHashes({}); }} className="text-xs text-muted-foreground hover:text-white transition-colors">
                 Change File
               </button>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compare with Expected Hash</label>
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <input 
                        type="text" 
                        value={expectedHash}
                        onChange={e => setExpectedHash(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-mono focus:border-primary/50 outline-none transition-all"
                        placeholder="Paste SHA-256 or SHA-1 hash here..."
                     />
                  </div>
               </div>

               <div className="space-y-4">
                  {isProcessing ? (
                    <div className="flex flex-col items-center py-12 space-y-4">
                       <Loader2 className="w-8 h-8 animate-spin text-primary" />
                       <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calculating Cryptographic Hashes...</p>
                    </div>
                  ) : (
                    Object.entries(hashes).map(([algo, hash]) => {
                      const isMatch = getMatchStatus(hash)
                      return (
                        <div key={algo} className={cn(
                          "p-6 rounded-2xl border transition-all space-y-3 group",
                          isMatch === true ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
                          isMatch === false ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10"
                        )}>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{algo}</span>
                                 {isMatch === true && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                 {isMatch === false && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                              </div>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(hash); toast.success(`${algo} copied`); }}
                                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                           </div>
                           <p className="text-xs font-mono break-all leading-relaxed text-white/90">{hash}</p>
                           {isMatch === true && <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Match Confirmed</p>}
                           {isMatch === false && <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Hash Mismatch</p>}
                        </div>
                      )
                    })
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
