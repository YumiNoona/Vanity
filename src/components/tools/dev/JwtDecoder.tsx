import React, { useState, useMemo, useEffect } from "react"
import { ShieldCheck, AlertTriangle, Key, Code2, PenTool, CheckCircle, Copy } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

const b64UrlEncode = (str: string) => {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function JwtDecoder() {
  const [activeTab, setActiveTab] = useState<"decode" | "build">("decode")
  
  // Decoder State
  const [token, setToken] = useState("")

  // Builder State
  const [buildHeader, setBuildHeader] = useState("{\n  \"alg\": \"HS256\",\n  \"typ\": \"JWT\"\n}")
  const [buildPayload, setBuildPayload] = useState("{\n  \"sub\": \"1234567890\",\n  \"name\": \"John Doe\",\n  \"iat\": 1516239022\n}")
  const [buildSecret, setBuildSecret] = useState("your-256-bit-secret")
  const [builtToken, setBuiltToken] = useState("")
  const [buildError, setBuildError] = useState<string | null>(null)

  const { isCopied, copy } = useCopyToClipboard()

  // Decoder Logic
  const { header, payload, isValid, error, isExpired } = useMemo(() => {
    if (!token.trim()) return { header: null, payload: null, isValid: false, error: null, isExpired: false }

    try {
      const parts = token.trim().split(".")
      if (parts.length !== 3) throw new Error("Invalid JWT format (expected 3 parts)")

      const b64Decode = (str: string) => {
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

  // Builder Logic
  useEffect(() => {
    const buildJwt = async () => {
      try {
        setBuildError(null)
        JSON.parse(buildHeader)
        JSON.parse(buildPayload)
        
        const header64 = b64UrlEncode(buildHeader)
        const payload64 = b64UrlEncode(buildPayload)
        
        const enc = new TextEncoder()
        const key = await window.crypto.subtle.importKey(
          "raw",
          enc.encode(buildSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        )
        const data = enc.encode(`${header64}.${payload64}`)
        const signature = await window.crypto.subtle.sign("HMAC", key, data)
        const sig64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")
          
        setBuiltToken(`${header64}.${payload64}.${sig64}`)
      } catch (e: any) {
        setBuildError("Invalid JSON format")
        setBuiltToken("")
      }
    }
    buildJwt()
  }, [buildHeader, buildPayload, buildSecret])

  return (
    <ToolLayout 
      title="JWT Studio" 
      description="Decode, verify, and build JSON Web Tokens entirely in your browser." 
      icon={ShieldCheck} 
      maxWidth="max-w-6xl"
      centered={true}
    >
      <div className="flex justify-center mb-8 relative z-10">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: "decode", label: "Decoder", icon: Code2 },
            { id: "build", label: "Builder", icon: PenTool }
          ]}
        />
      </div>

      {activeTab === "decode" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 animate-in fade-in duration-500">
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 animate-in fade-in duration-500">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-rose-400">Header (JSON)</label>
              <textarea 
                value={buildHeader}
                onChange={e => setBuildHeader(e.target.value)}
                className="w-full h-32 bg-black/40 border border-rose-500/20 rounded-xl p-4 font-mono text-sm resize-none outline-none focus:border-rose-500/50 text-rose-100"
                spellCheck={false}
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-purple-400">Payload (JSON)</label>
              <textarea 
                value={buildPayload}
                onChange={e => setBuildPayload(e.target.value)}
                className="w-full h-64 bg-black/40 border border-purple-500/20 rounded-xl p-4 font-mono text-sm resize-none outline-none focus:border-purple-500/50 text-purple-100"
                spellCheck={false}
              />
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-sky-400">Verify Signature (HS256)</label>
              <input 
                type="text"
                value={buildSecret}
                onChange={e => setBuildSecret(e.target.value)}
                className="w-full bg-black/40 border border-sky-500/20 rounded-xl p-4 font-mono text-sm outline-none focus:border-sky-500/50 text-sky-100"
                placeholder="Secret"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generated Token</label>
              <button 
                onClick={() => builtToken && copy(builtToken)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                disabled={!builtToken}
              >
                {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            <textarea 
              readOnly
              value={builtToken}
              className="w-full h-[500px] bg-black/40 border border-white/10 rounded-xl p-6 font-mono text-sm resize-none outline-none break-all text-muted-foreground"
              placeholder="Your token will appear here..."
              spellCheck={false}
            />
            {buildError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" /> {buildError}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}

