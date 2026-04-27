import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Globe2, Search, Loader2, ArrowRight, ShieldCheck, AlertCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DnsRecord {
  name: string
  type: number
  TTL: number
  data: string
}

const RECORD_TYPES: Record<string, number> = {
  A: 1,
  AAAA: 28,
  MX: 15,
  TXT: 16,
  CNAME: 5,
  NS: 2,
}

export function DnsLookup() {
  const [domain, setDomain] = useState("")
  const [results, setResults] = useState<Record<string, DnsRecord[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  const lookup = async () => {
    if (!domain) return
    setIsLoading(true)
    setResults({})

    try {
      const cleanDomain = domain.replace(/https?:\/\//, "").split("/")[0]
      const types = Object.keys(RECORD_TYPES)
      const newResults: Record<string, DnsRecord[]> = {}

      await Promise.all(types.map(async type => {
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=${type}`, {
          headers: { "accept": "application/dns-json" }
        })
        const data = await response.json()
        if (data.Answer) {
          newResults[type] = data.Answer
        }
      }))

      setResults(newResults)
      if (Object.keys(newResults).length === 0) {
        toast.error("No records found for this domain")
      } else {
        toast.success("DNS records retrieved")
      }
    } catch (error) {
      toast.error("Failed to fetch DNS records")
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeName = (type: number) => {
    return Object.keys(RECORD_TYPES).find(key => RECORD_TYPES[key] === type) || type.toString()
  }

  return (
    <ToolLayout
      title="DNS Lookup"
      description="Resolve A, MX, TXT, and CNAME records via Cloudflare's secure DNS-over-HTTPS."
      icon={Globe2}
      centered={true}
      maxWidth="max-w-4xl"
    >
      <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
           <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                 <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <input 
                    type="text" 
                    value={domain} 
                    onChange={e => setDomain(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && lookup()}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg focus:border-primary/50 outline-none transition-all"
                    placeholder="example.com"
                 />
              </div>
              <button 
                 onClick={lookup}
                 disabled={isLoading || !domain}
                 className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Lookup Records
              </button>
           </div>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {Object.entries(results).map(([type, records]) => (
              <div key={type} className="glass-panel rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs font-black uppercase tracking-widest">{type} Records</span>
                   </div>
                   <span className="text-[10px] font-mono text-muted-foreground">{records.length} found</span>
                </div>
                <div className="p-4 space-y-3">
                   {records.map((r, i) => (
                     <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 space-y-1 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start gap-4">
                           <p className="text-xs font-mono break-all text-white/90">{r.data.replace(/^"|"$/g, "")}</p>
                           <span className="text-[10px] font-mono text-muted-foreground shrink-0">TTL: {r.TTL}</span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && Object.keys(results).length === 0 && domain && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4 opacity-50">
             <FileText className="w-12 h-12" />
             <p className="text-sm">Enter a domain above to inspect its public DNS configuration.</p>
          </div>
        )}
      </div>
      </div>
    </ToolLayout>
  )
}
