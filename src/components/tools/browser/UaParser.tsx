import React, { useState, useEffect } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { MonitorSmartphone, Search, Monitor, Smartphone, Globe, Settings, Cpu, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

interface UaData {
  browser: string
  version: string
  os: string
  engine: string
  device: string
}

export function UaParser() {
  const [ua, setUa] = useState("")
  const [parsed, setParsed] = useState<UaData | null>(null)

  const parseUa = (str: string) => {
    let browser = "Unknown Browser"
    let version = "Unknown"
    let os = "Unknown OS"
    let engine = "Unknown Engine"
    let device = "Desktop"

    // Engine
    if (str.includes("AppleWebKit")) engine = "WebKit"
    if (str.includes("Gecko") && !str.includes("WebKit")) engine = "Gecko"
    if (str.includes("Trident")) engine = "Trident"
    if (str.includes("Blink")) engine = "Blink"

    // OS
    if (str.includes("Windows")) os = "Windows"
    if (str.includes("Macintosh") || str.includes("Mac OS")) os = "macOS"
    if (str.includes("Android")) os = "Android"
    if (str.includes("iPhone") || str.includes("iPad")) os = "iOS"
    if (str.includes("Linux")) os = "Linux"

    // Device
    if (str.includes("Mobi")) device = "Mobile"
    if (str.includes("iPad") || str.includes("Tablet")) device = "Tablet"

    // Browser
    if (str.includes("Firefox/")) {
      browser = "Firefox"
      version = str.split("Firefox/")[1].split(" ")[0]
    } else if (str.includes("Edg/")) {
      browser = "Edge"
      version = str.split("Edg/")[1].split(" ")[0]
    } else if (str.includes("Chrome/")) {
      browser = "Chrome"
      version = str.split("Chrome/")[1].split(" ")[0]
    } else if (str.includes("Safari/") && str.includes("Version/")) {
      browser = "Safari"
      version = str.split("Version/")[1].split(" ")[0]
    }

    setParsed({ browser, version, os, engine, device })
  }

  useEffect(() => {
    const currentUa = navigator.userAgent
    setUa(currentUa)
    parseUa(currentUa)
  }, [])

  return (
    <ToolLayout
      title="User Agent Parser"
      description="Break down any User Agent string into browser, engine, OS, and device type instantly."
      icon={MonitorSmartphone}
      centered={true}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
           <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input User Agent String</label>
           <textarea 
              value={ua} 
              onChange={e => { setUa(e.target.value); parseUa(e.target.value); }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm focus:border-primary/50 outline-none transition-all h-32 resize-none"
              placeholder="Mozilla/5.0..."
           />
        </div>

        {parsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                   <Globe className="w-6 h-6" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Browser</label>
                   <p className="text-sm font-bold">{parsed.browser} {parsed.version}</p>
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                   <Monitor className="w-6 h-6" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operating System</label>
                   <p className="text-sm font-bold">{parsed.os}</p>
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                   <Cpu className="w-6 h-6" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Engine</label>
                   <p className="text-sm font-bold">{parsed.engine}</p>
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                   {parsed.device === "Mobile" ? <Smartphone className="w-6 h-6" /> : <MonitorSmartphone className="w-6 h-6" />}
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Device Type</label>
                   <p className="text-sm font-bold">{parsed.device}</p>
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                   <HardDrive className="w-6 h-6" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Screen Info</label>
                   <p className="text-sm font-bold">{window.screen.width}x{window.screen.height} ({window.devicePixelRatio}x)</p>
                </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                   <Settings className="w-6 h-6" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Languages</label>
                   <p className="text-sm font-bold uppercase tracking-tight">{navigator.languages.join(", ")}</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
