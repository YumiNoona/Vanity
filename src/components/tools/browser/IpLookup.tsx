import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { MapPin, Globe, Search, Loader2, Info, Navigation, Server, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface IpData {
  query: string
  status: string
  country: string
  countryCode: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
}

export function IpLookup() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<IpData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const lookup = async (ip: string = query) => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`)
      const data = await response.json()
      if (data.status === "success") {
        setResults(data)
        setQuery(data.query)
      } else {
        toast.error("Invalid IP or domain")
      }
    } catch (error) {
      toast.error("Lookup failed")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Lookup user's own IP on load
    lookup("")
  }, [])

  return (
    <ToolLayout
      title="IP Lookup"
      description="Inspect geolocation, ISP, and ASN data for any IP address or domain instantly."
      icon={MapPin}
    >
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
           <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <input 
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && lookup()}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg focus:border-primary/50 outline-none transition-all"
                    placeholder="Enter IP or Domain (leave blank for yours)"
                 />
              </div>
              <button 
                 onClick={() => lookup()}
                 disabled={isLoading}
                 className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                Trace IP
              </button>
           </div>
        </div>

        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel rounded-3xl border border-white/5 bg-black/20 overflow-hidden">
                   <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Globe className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-sm font-black uppercase tracking-widest">{results.query}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{results.city}, {results.country}</p>
                         </div>
                      </div>
                      <img 
                        src={`https://flagcdn.com/w40/${results.countryCode.toLowerCase()}.png`} 
                        alt={results.country}
                        className="h-6 rounded shadow-sm"
                      />
                   </div>
                   
                   <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country</label>
                         <p className="text-sm font-bold">{results.country} ({results.countryCode})</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region / State</label>
                         <p className="text-sm font-bold">{results.regionName}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</label>
                         <p className="text-sm font-bold">{results.city}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Postal Code</label>
                         <p className="text-sm font-bold font-mono">{results.zip || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timezone</label>
                         <p className="text-sm font-bold">{results.timezone}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coordinates</label>
                         <p className="text-sm font-bold font-mono">{results.lat}, {results.lon}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 space-y-6">
                   <div className="flex items-center gap-3">
                      <Server className="w-5 h-5 text-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest">Network Info</h3>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ISP</label>
                         <p className="text-xs font-bold leading-tight">{results.isp}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization</label>
                         <p className="text-xs font-bold leading-tight">{results.org || results.isp}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ASN</label>
                         <p className="text-xs font-mono font-bold text-primary">{results.as}</p>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-4">
                   <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-muted-foreground leading-relaxed">
                     Your connection is routed through <span className="text-emerald-400 font-bold">{results.isp}</span>. This tool uses the ip-api system for accurate client-side resolution.
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
