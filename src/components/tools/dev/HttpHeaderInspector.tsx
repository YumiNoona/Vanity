import React, { useState } from "react"
import { Globe, Search, Copy, CheckCircle, Shield, Zap, AlertCircle, RefreshCw, Layers } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { proxyFetch } from "@/lib/proxy"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { cn } from "@/lib/utils"

interface HeaderPair {
  key: string
  value: string
  category: "security" | "caching" | "content" | "other"
}

export function HttpHeaderInspector() {
  const [url, setUrl] = useState("https://google.com")
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState<HeaderPair[]>([])
  const [status, setStatus] = useState<{ code: number; text: string } | null>(null)
  const { copiedId, copy } = useCopyToClipboard()

  const inspectHeaders = async () => {
    if (!url) return
    setLoading(true)
    setHeaders([])
    setStatus(null)

    try {
      // We use HEAD request via proxy to get just the headers
      const res = await proxyFetch(url, { method: "HEAD" })
      
      const headerPairs: HeaderPair[] = []
      res.headers.forEach((value, key) => {
        let category: HeaderPair["category"] = "other"
        const k = key.toLowerCase()
        if (k.includes("security") || k.includes("x-frame") || k.includes("content-security") || k.includes("strict-transport")) category = "security"
        else if (k.includes("cache") || k.includes("expires") || k.includes("etag") || k.includes("vary")) category = "caching"
        else if (k.includes("content-type") || k.includes("content-length") || k.includes("encoding")) category = "content"
        
        headerPairs.push({ key, value, category })
      })

      setHeaders(headerPairs.sort((a, b) => a.category.localeCompare(b.category)))
      setStatus({ code: res.status, text: res.statusText })
      toast.success("Headers inspected successfully")
    } catch (err: any) {
      toast.error("Failed to fetch headers. Ensure URL is correct and proxy is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout title="Header Oracle" description="Inspect raw HTTP response headers, security policies, and caching directives." icon={Globe} centered maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-12">
           <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/20 space-y-6">
              <div className="flex gap-4">
                 <input 
                   type="text" 
                   value={url} 
                   onChange={e => setUrl(e.target.value)}
                   placeholder="https://example.com"
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono outline-none focus:border-primary/50 transition-all"
                 />
                 <button 
                   onClick={inspectHeaders}
                   disabled={loading}
                   className="px-8 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                 >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} Analyze
                 </button>
              </div>

              {status && (
                <div className="flex gap-4 items-center p-4 bg-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                   <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase", status.code < 300 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                      Status: {status.code} {status.text}
                   </div>
                   <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Total Headers: {headers.length}
                   </div>
                </div>
              )}
           </div>
        </div>

        {headers.length > 0 ? (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
             {["security", "caching", "content", "other"].map(cat => {
               const catHeaders = headers.filter(h => h.category === cat)
               if (catHeaders.length === 0) return null
               return (
                 <div key={cat} className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-4 h-fit">
                    <div className="flex items-center gap-2 mb-2">
                       {cat === "security" && <Shield className="w-4 h-4 text-emerald-400" />}
                       {cat === "caching" && <Zap className="w-4 h-4 text-amber-400" />}
                       {cat === "content" && <Layers className="w-4 h-4 text-blue-400" />}
                       {cat === "other" && <Globe className="w-4 h-4 text-muted-foreground" />}
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{cat} Headers</span>
                    </div>
                    <div className="space-y-3">
                       {catHeaders.map(h => (
                         <div key={h.key} className="group p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-2 hover:border-primary/20 transition-all relative">
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter truncate pr-6">{h.key}</p>
                            <p className="text-[11px] font-mono text-white/70 break-all leading-tight">{h.value}</p>
                            <button 
                              onClick={() => copy(h.value, h.key)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1 bg-white/5 rounded"
                            >
                               {copiedId === h.key ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
               )
             })}
          </div>
        ) : !loading && (
          <div className="lg:col-span-12 py-20 flex flex-col items-center justify-center opacity-10 space-y-4">
             <Globe className="w-20 h-20" />
             <p className="text-sm font-black uppercase tracking-[0.5em]">Waiting for URL</p>
          </div>
        )}
      </div>

      <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex gap-4">
         <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
         <p className="text-[11px] text-muted-foreground leading-relaxed uppercase font-bold">
           Note: This tool uses a proxy to bypass browser CORS restrictions. Results may vary depending on how the target server handles proxy requests or automated HEAD inquiries.
         </p>
      </div>
    </ToolLayout>
  )
}
