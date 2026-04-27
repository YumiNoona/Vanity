import React, { useState, useMemo } from "react"
import { ShieldCheck, AlertTriangle, Key, Code2 } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"

export function JwtDecoder() {
  const [token, setToken] = useState("")

  const { header, payload, isValid, error, isExpired } = useMemo(() => {
    if (!token.trim()) return { header: null, payload: null, isValid: false, error: null, isExpired: false }

    try {
      const parts = token.trim().split(".")
      if (parts.length !== 3) throw new Error("Invalid JWT format (expected 3 parts)")

      const b64Decode = (str: string) => {
        // Handle base64url padding
        let s = str.replace(/-/g, "+").replace(/_/g, "/")
        while (s.length % 4) s += "="
        return decodeURIComponent(escape(atob(s)))
      }

      const decodedHeader = JSON.parse(b64Decode(parts[0]))
      const decodedPayload = JSON.parse(b64Decode(parts[1]))
      
      let expired = false
      if (decodedPayload.exp) {
        expired = (decodedPayload.exp * 1000) < Date.now()
      }

      return {
        header: decodedHeader,
        payload: decodedPayload,
        isValid: true,
        error: null,
        isExpired: expired
      }
    } catch (e: any) {
      return {
        header: null,
        payload: null,
        isValid: false,
        error: e.message || "Failed to parse token",
        isExpired: false
      }
    }
  }, [token])

  return (
    <ToolLayout 
      title="JWT Decoder" 
      description="Decode JSON Web Tokens locally. No data leaves your browser." 
      icon={ShieldCheck} 
      maxWidth="max-w-6xl"
      centered={true}
    >

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
        <div className="space-y-4">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Encoded JWT string</label>
           <textarea 
             value={token}
             onChange={e => setToken(e.target.value)}
             className="w-full h-[500px] bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none focus:border-emerald-500/30 transition-all break-all caret-emerald-400 text-muted-foreground"
             placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
             spellCheck={false}
           />
           {error && (
             <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
             </div>
           )}
        </div>

        <div className="space-y-6">
           <div className="space-y-4">
             <label className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
               <Code2 className="w-4 h-4" /> Header <span className="text-muted-foreground ml-2">Algorithm & Type</span>
             </label>
             <div className="bg-black/30 border border-rose-500/20 rounded-xl p-4 overflow-x-auto">
               <pre className="font-mono text-sm text-rose-100">
                 {isValid ? JSON.stringify(header, null, 2) : "..."}
               </pre>
             </div>
           </div>

           <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Payload <span className="text-muted-foreground ml-2">Data & Claims</span>
                </label>
                {isValid && payload?.exp && (
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {isExpired ? "Token Expired" : "Active"}
                  </span>
                )}
             </div>
             
             <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4 overflow-x-auto min-h-[250px]">
               <pre className="font-mono text-sm text-purple-100">
                 {isValid ? JSON.stringify(payload, null, 2) : "..."}
               </pre>
             </div>
             {isValid && payload?.exp && (
                <div className="text-xs text-muted-foreground">
                  Expires: <span className="text-white">{new Date(payload.exp * 1000).toLocaleString()}</span>
                </div>
             )}
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
