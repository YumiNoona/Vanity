import React, { useState, useMemo } from "react"
import { Eye, CheckCircle2, XCircle } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { ColorPickerInput } from "@/components/shared/ColorPickerInput"

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function luminance({ r, g, b }: { r: number, g: number, b: number }) {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

function contrastRatio(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return null
  const l1 = luminance(rgb1)
  const l2 = luminance(rgb2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function ColorContrastChecker() {
  const [fg, setFg] = useState("#FFFFFF")
  const [bg, setBg] = useState("#000000")

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg])

  const results = useMemo(() => {
    if (ratio === null) return null
    return {
      normalAA: ratio >= 4.5,
      normalAAA: ratio >= 7.0,
      largeAA: ratio >= 3.0,
      largeAAA: ratio >= 4.5,
    }
  }, [ratio])

  const isValidHex = (hex: string) => /^#?([0-9A-F]{3}){1,2}$/i.test(hex)

  return (
    <ToolLayout title="Color Contrast Checker" description="Calculate contrast ratio and check WCAG accessibility." icon={Eye} centered={true} maxWidth="max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
            <div className="space-y-3">
                <ColorPickerInput color={fg} onChange={setFg} label="Text Color (Foreground)" className="w-full" />
            </div>

            <div className="space-y-3">
                <ColorPickerInput color={bg} onChange={setBg} label="Background Color" className="w-full" />
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 text-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4">Contrast Ratio</label>
            <div className="text-6xl font-black font-mono tracking-tighter text-white">
              {ratio ? ratio.toFixed(2) : "N/A"} <span className="text-2xl text-muted-foreground">: 1</span>
            </div>
            {ratio && (
              <p className="text-xs text-muted-foreground mt-4">
                {ratio >= 4.5 ? "Good contrast!" : "Poor contrast. Try adjusting colors."}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden h-64 flex flex-col justify-center p-8 transition-colors duration-300 shadow-2xl" style={{ backgroundColor: isValidHex(bg) ? (bg.startsWith('#') ? bg : '#'+bg) : '#000000' }}>
              <div style={{ color: isValidHex(fg) ? (fg.startsWith('#') ? fg : '#'+fg) : '#ffffff' }}>
                 <h2 className="text-3xl font-black mb-4">Large Text Preview</h2>
                 <p className="text-sm font-medium leading-relaxed">This is normal text. The contrast ratio indicates how well text can be read against the background. WCAG guidelines recommend a minimum ratio of 4.5:1 for normal text.</p>
              </div>
           </div>

           {results && (
             <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Normal Text</h3>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-white">AA <span className="text-[10px] text-muted-foreground ml-1">4.5:1</span></span>
                         {results.normalAA ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-white">AAA <span className="text-[10px] text-muted-foreground ml-1">7.0:1</span></span>
                         {results.normalAAA ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                   </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Large Text</h3>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-white">AA <span className="text-[10px] text-muted-foreground ml-1">3.0:1</span></span>
                         {results.largeAA ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-white">AAA <span className="text-[10px] text-muted-foreground ml-1">4.5:1</span></span>
                         {results.largeAAA ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

      </div>
    </ToolLayout>
  )
}
