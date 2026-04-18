import React, { useState, useRef, useEffect, useCallback } from "react"
import { Download, ArrowLeft, QrCode, Copy, CheckCircle } from "lucide-react"
import QRCode from "qrcode"
import { toast } from "sonner"

import { downloadBlob } from "@/lib/canvas"

export function QRGenerator() {
  const [text, setText] = useState("https://vanity.tools")
  const [qrBlob, setQrBlob] = useState<Blob | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Cleanup Object URLs on unmount or when URL changes
  const prevUrlRef = useRef<string | null>(null)
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    }
  }, [])
  
  const generateQR = async () => {
    if (!text) return
    setIsProcessing(true)
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 1024,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      })
      
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      // Revoke previous URL before creating new one
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
      const newUrl = URL.createObjectURL(blob)
      prevUrlRef.current = newUrl
      setQrBlob(blob)
      setQrUrl(newUrl)
      toast.success("QR Code generated!")
    } catch (err) {
      toast.error("Failed to generate QR")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!qrBlob) return
    downloadBlob(qrBlob, "vanity-qr.png")
  }

  // Generate initial QR
  React.useEffect(() => {
    generateQR()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold font-syne mb-2">QR Generator</h1>
          <p className="text-muted-foreground text-sm">Create high-resolution QR codes instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        <div className="glass-panel p-6 rounded-xl space-y-6">
           <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Content (URL or Text)</label>
              <textarea 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Enter URL or text here..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:border-primary outline-none resize-none"
              />
              <button 
                onClick={generateQR}
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Generate QR Code
              </button>
           </div>

           <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-muted-foreground leading-relaxed">
             Vanity generates QR codes locally. Your data never leaves your browser, making it safe for private links and credentials.
           </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center bg-white min-h-[400px]">
           {qrUrl ? (
             <>
               <img src={qrUrl} alt="QR Code" className="w-64 h-64 shadow-xl mb-8" />
               <button 
                 onClick={handleDownload}
                 className="px-8 py-3 bg-black text-white font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-all"
               >
                 <Download className="w-4 h-4" /> Download PNG
               </button>
             </>
           ) : (
             <QrCode className="w-16 h-16 text-black/20 animate-pulse" />
           )}
        </div>
      </div>
    </div>
  )
}
