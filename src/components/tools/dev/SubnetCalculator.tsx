import React, { useState, useMemo } from "react"
import { Network, Server, Globe } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function SubnetCalculator() {
  const [ip, setIp] = useState("192.168.1.0")
  const [cidr, setCidr] = useState<number>(24)

  const calc = useMemo(() => {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return null

    const ipInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
    const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr))
    
    const networkInt = ipInt & maskInt
    const broadcastInt = networkInt | ~maskInt
    
    const toStr = (int: number) => `${(int >>> 24) & 255}.${(int >>> 16) & 255}.${(int >>> 8) & 255}.${int & 255}`
    
    const numHosts = cidr >= 31 ? 0 : Math.pow(2, 32 - cidr) - 2

    return {
      ip: toStr(ipInt),
      mask: toStr(maskInt),
      network: toStr(networkInt),
      broadcast: toStr(broadcastInt),
      firstHost: cidr >= 31 ? "N/A" : toStr(networkInt + 1),
      lastHost: cidr >= 31 ? "N/A" : toStr(broadcastInt - 1),
      numHosts,
      wildcard: toStr(~maskInt)
    }
  }, [ip, cidr])

  return (
    <ToolLayout title="Subnet Calculator" description="CIDR network calculations, host ranges, and subnet masks." icon={Network} centered={true} maxWidth="max-w-4xl">
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">IP Address</label>
               <input 
                 value={ip} 
                 onChange={e => setIp(e.target.value)} 
                 className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xl outline-none focus:border-primary/50 text-white" 
                 placeholder="192.168.1.0"
               />
            </div>
            <div className="text-3xl font-light text-muted-foreground mt-6">/</div>
            <div className="w-full md:w-32 space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CIDR</label>
               <input 
                 type="number"
                 min={0}
                 max={32}
                 value={cidr} 
                 onChange={e => setCidr(parseInt(e.target.value) || 0)} 
                 className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xl outline-none focus:border-primary/50 text-white text-center" 
               />
            </div>
          </div>
          <div className="mt-6">
            <input 
              type="range" 
              min={0} 
              max={32} 
              value={cidr} 
              onChange={e => setCidr(parseInt(e.target.value))} 
              className="w-full accent-primary" 
            />
          </div>
        </div>

        {calc ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network Address</span>
                <div className="font-mono text-xl text-primary font-bold">{calc.network}</div>
             </div>
             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Broadcast Address</span>
                <div className="font-mono text-xl text-rose-400 font-bold">{calc.broadcast}</div>
             </div>
             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subnet Mask</span>
                <div className="font-mono text-lg text-white/90">{calc.mask}</div>
             </div>
             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wildcard Mask</span>
                <div className="font-mono text-lg text-white/90">{calc.wildcard}</div>
             </div>
             <div className="sm:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 bg-emerald-500/5 space-y-4">
                <div className="flex items-center gap-2">
                   <Server className="w-5 h-5 text-emerald-400" />
                   <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Usable Host Range</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div className="font-mono text-xl text-white">
                     {calc.firstHost} <span className="text-muted-foreground mx-2">-</span> {calc.lastHost}
                   </div>
                   <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-bold border border-emerald-500/30">
                     {calc.numHosts.toLocaleString()} hosts
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground italic border border-white/5 rounded-3xl bg-black/10">
            Enter a valid IPv4 address to calculate subnet details.
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
