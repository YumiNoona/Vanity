import React, { useState, useEffect } from "react"
import { 
  Link as LinkIcon, Scissors, Copy, CheckCircle, 
  RefreshCw, History, QrCode, ExternalLink, Trash2,
  AlertCircle
} from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { toast } from "sonner"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { proxyFetch } from "@/lib/proxy"
import QRCode from "qrcode"
import { motion, AnimatePresence } from "framer-motion"

interface ShortLink {
  id: string
  original: string
  short: string
  timestamp: number
}

export function LinkShortener() {
  const [url, setUrl] = useState("")
  const [isShortening, setIsShortening] = useState(false)
  const [shortUrl, setShortUrl] = useState("")
  const [qrUrl, setQrUrl] = useState("")
  const [history, setHistory] = useState<ShortLink[]>(() => {
    try {
      const saved = sessionStorage.getItem("link_history")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const { copiedId, copy } = useCopyToClipboard()

  useEffect(() => {
    try {
      sessionStorage.setItem("link_history", JSON.stringify(history))
    } catch {}
  }, [history])

  useEffect(() => {
    if (shortUrl) {
      QRCode.toDataURL(shortUrl, {
        margin: 2,
        width: 400,
        color: {
          dark: "#FFFFFF",
          light: "#0a0a0a"
        }
      }).then(setQrUrl).catch(console.error)
    }
  }, [shortUrl])

  const isValidUrl = (str: string) => {
    try {
      const u = new URL(str)
      return u.protocol === "http:" || u.protocol === "https:"
    } catch {
      return false
    }
  }

  const handleShorten = async () => {
    if (!url.trim()) return
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL (starting with http/https)")
      return
    }

    setIsShortening(true)
    setShortUrl("")
    
    try {
      // Attempt 1: is.gd
      let result = ""
      try {
        const res = await proxyFetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
        if (res.ok) {
          result = (await res.text()).trim()
        }
      } catch (e) {
        console.warn("is.gd failed, trying TinyURL...")
      }

      // Attempt 2: TinyURL
      if (!result) {
        const res = await proxyFetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
        if (res.ok) {
          result = (await res.text()).trim()
        }
      }

      if (result && result.startsWith("http")) {
        setShortUrl(result)
        const newLink: ShortLink = {
          id: Math.random().toString(36).substring(7),
          original: url,
          short: result,
          timestamp: Date.now()
        }
        setHistory(prev => [newLink, ...prev].slice(0, 10))
        toast.success("Link shortened!")
      } else {
        throw new Error("Service unavailable")
      }
    } catch (e) {
      toast.error("Failed to shorten link. Please try again later.")
    } finally {
      setIsShortening(false)
    }
  }

  const removeHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  return (
    <ToolLayout
      title="Link Shortener"
      description="Create clean, short links using public anonymizing services."
      icon={Scissors}
      centered={true}
    >
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Input Panel */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/20 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Paste your long URL</label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                <LinkIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="https://example.com/very/long/path/to/something..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-white outline-none focus:border-primary/50 transition-all font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleShorten}
            disabled={isShortening || !url}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
          >
            {isShortening ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            {isShortening ? "Shortening..." : "Shorten Link"}
          </button>

          <div className="flex items-center gap-2 px-2 text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
            <AlertCircle className="w-3 h-3 text-amber-500/50" />
            <span>Note: Short links are public and permanent. Avoid sensitive data.</span>
          </div>
        </div>

        {/* Result Panel */}
        <AnimatePresence>
          {shortUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-10 rounded-[3rem] border border-primary/20 bg-primary/5 space-y-8 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <LinkIcon className="w-48 h-48 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">Your Short Link</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Ready to share</p>
              </div>

              <div className="flex flex-col items-center gap-8">
                <div className="flex items-center gap-4 bg-black/60 p-2 pl-8 rounded-3xl border border-white/10 w-full max-w-lg group">
                  <span className="text-xl font-bold font-mono text-primary flex-1 truncate">{shortUrl}</span>
                  <button
                    onClick={() => copy(shortUrl, "short")}
                    className="p-5 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    {copiedId === "short" ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                {qrUrl && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl">
                      <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                      <QrCode className="w-3 h-3" /> Scan to open
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Panel */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Recent Links
              </h3>
              <button 
                onClick={() => setHistory([])}
                className="text-[9px] font-bold text-red-400/50 hover:text-red-400 uppercase tracking-widest transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="glass-panel p-4 px-6 rounded-2xl border border-white/5 bg-black/20 flex items-center justify-between group hover:border-white/10 transition-all"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white truncate max-w-[200px]">{item.short}</span>
                      <a 
                        href={item.short} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate opacity-50">{item.original}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copy(item.short, item.id)}
                      className="p-2.5 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl transition-all border border-white/5"
                    >
                      {copiedId === item.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeHistoryItem(item.id)}
                      className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-all border border-white/5 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </ToolLayout>
  )
}
