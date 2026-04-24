import React, { useState, useRef, useEffect } from "react"
import { Download, ArrowLeft, Barcode as BarcodeIcon } from "lucide-react"
import { ToolLayout, ToolUploadLayout } from "@/components/layout/ToolLayout"
import JsBarcode from "jsbarcode"
import { toast } from "sonner"

import { useObjectUrl } from "@/hooks/useObjectUrl"
import { downloadBlob, exportCanvas } from "@/lib/canvas"

export function BarcodeGenerator() {
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [text, setText] = useState("VANITYTOOLS")
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const generateBarcode = () => {
    if (!text || !svgRef.current) return
    try {
      JsBarcode(svgRef.current, text, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        background: "#ffffff",
        lineColor: "#000000",
      })
    } catch (err) {
      toast.error("Invalid barcode content")
    }
  }

  useEffect(() => {
    generateBarcode()
    setResultUrl(null)
  }, [text, setResultUrl])

  const handleDownload = async () => {
    if (!svgRef.current) return
    
    try {
      if (resultUrl) {
         const a = document.createElement("a")
         a.href = resultUrl
         a.download = "vanity-barcode.png"
         a.click()
         return
      }

      const svgData = new XMLSerializer().serializeToString(svgRef.current)
      const canvas = document.createElement("canvas")
      const svgSize = svgRef.current.getBBox()
      canvas.width = svgSize.width + 40
      canvas.height = svgSize.height + 40
      const ctx = canvas.getContext("2d")!
      
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const img = new Image()
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = async () => {
        ctx.drawImage(img, 20, 20)
        const blob = await exportCanvas(canvas, "image/png", 1.0)
        setResultUrl(blob)
        URL.revokeObjectURL(url)
        
        // Trigger download immediately for first time
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob) // Transient for this specific click
        a.download = "vanity-barcode.png"
        a.click()
        URL.revokeObjectURL(a.href)
      }
      img.src = url
    } catch (error) {
      toast.error("Failed to export barcode")
    }
  }

  return (
    <ToolLayout title="Barcode Generator" description="Generate commercial-grade barcodes instantly.">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        <div className="glass-panel p-6 rounded-xl space-y-6">
           <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Barcode Value</label>
              <input 
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Enter numbers or text..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-primary outline-none"
              />
           </div>
           
           <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-[10px] text-muted-foreground leading-relaxed">
             Vanity uses standard CODE128 encoding suitable for most logistics and inventory applications. The barcodes are generated 100% on your device.
           </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center bg-white min-h-[400px]">
           <div className="bg-white p-4 rounded shadow-inner">
              <svg ref={svgRef}></svg>
           </div>
           
           <button 
             onClick={handleDownload}
             className="mt-8 px-8 py-3 bg-black text-white font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-all"
           >
             <Download className="w-4 h-4" /> Export
           </button>
        </div>
      </div>
    </ToolLayout>
  )
}
