import React, { useState, useEffect } from "react"
import { Layout, Maximize, CheckCircle, Copy } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

const COMMON_RATIOS = [
  { label: "1:1", w: 1, h: 1, desc: "Square (Instagram, Icons)" },
  { label: "4:3", w: 4, h: 3, desc: "Standard TV / iPad" },
  { label: "16:9", w: 16, h: 9, desc: "Widescreen / YouTube" },
  { label: "21:9", w: 21, h: 9, desc: "Ultrawide Cinema" },
  { label: "3:2", w: 3, h: 2, desc: "Classic 35mm / Laptops" },
  { label: "9:16", w: 9, h: 16, desc: "Vertical (TikTok, Reels)" }
]

export function AspectRatioCalc() {
  const [w1, setW1] = useState<number | "">("")
  const [h1, setH1] = useState<number | "">("")
  const [w2, setW2] = useState<number | "">(1920)
  const [h2, setH2] = useState<number | "">(1080)
  
  const { isCopied, copy } = useCopyToClipboard()

  // Calculate GCD for ratio simplification
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)

  // When W1/H1 change (The Ratio)
  useEffect(() => {
    if (w1 && h1 && w2) {
      setH2(Math.round((Number(w2) * Number(h1)) / Number(w1)))
    }
  }, [w1, h1])

  // When W2 changes
  const handleW2Change = (val: string) => {
    const num = Number(val)
    setW2(val ? num : "")
    if (val && w1 && h1) {
      setH2(Math.round((num * Number(h1)) / Number(w1)))
    }
  }

  // When H2 changes
  const handleH2Change = (val: string) => {
    const num = Number(val)
    setH2(val ? num : "")
    if (val && w1 && h1) {
      setW2(Math.round((num * Number(w1)) / Number(h1)))
    }
  }

  // Find ratio from W2/H2
  const extractRatio = () => {
    if (w2 && h2) {
      const d = gcd(Number(w2), Number(h2))
      setW1(Number(w2) / d)
      setH1(Number(h2) / d)
    }
  }

  const cssSnippet = `/* CSS Aspect Ratio */
.container {
  aspect-ratio: ${w1 || w2 || 16} / ${h1 || h2 || 9};
  width: 100%;
  object-fit: cover;
}`

  return (
    <ToolLayout title="Aspect Ratio Calculator" description="Compute dimensions, simplify ratios, and generate CSS." icon={Maximize} centered={true} maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original Ratio</label>
                <button onClick={extractRatio} className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase">Extract from Dimensions</button>
              </div>
              <div className="flex items-center gap-4">
                <input type="number" value={w1} onChange={e => setW1(e.target.value ? Number(e.target.value) : "")} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-center font-mono text-2xl outline-none focus:border-primary/50" placeholder="16" />
                <span className="text-2xl font-bold text-muted-foreground">:</span>
                <input type="number" value={h1} onChange={e => setH1(e.target.value ? Number(e.target.value) : "")} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-center font-mono text-2xl outline-none focus:border-primary/50" placeholder="9" />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">New Dimensions</label>
              <div className="flex items-center gap-4">
                <div className="w-full space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Width</span>
                  <input type="number" value={w2} onChange={e => handleW2Change(e.target.value)} className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 text-center font-mono text-2xl outline-none focus:border-primary/50 text-primary" placeholder="1920" />
                </div>
                <span className="text-2xl font-bold text-muted-foreground mt-6">×</span>
                <div className="w-full space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Height</span>
                  <input type="number" value={h2} onChange={e => handleH2Change(e.target.value)} className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 text-center font-mono text-2xl outline-none focus:border-primary/50 text-primary" placeholder="1080" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative group bg-black/20 border border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">CSS Snippet</label>
            <textarea readOnly value={cssSnippet} className="w-full h-24 bg-transparent resize-none outline-none font-mono text-sm text-sky-400" />
            <button onClick={() => copy(cssSnippet)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg hover:bg-white/10">
              {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Common Ratios</h3>
            <div className="space-y-2">
              {COMMON_RATIOS.map(r => (
                <button 
                  key={r.label}
                  onClick={() => { setW1(r.w); setH1(r.h); }}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-primary/30"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-bold text-sm">{r.label}</span>
                    <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                  </div>
                  <Layout className="w-5 h-5 text-muted-foreground opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}
