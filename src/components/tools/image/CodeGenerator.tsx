import React, { useState } from "react"
import { QRGenerator } from "./QRGenerator"
import { BarcodeGenerator } from "./BarcodeGenerator"
import { QrCode, Barcode } from "lucide-react"

export function CodeGenerator() {
  const [activeTab, setActiveTab] = useState<"qr" | "barcode">("qr")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10">
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab("qr")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "qr" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <QrCode className="w-4 h-4" /> QR Code
          </button>
          <button 
            onClick={() => setActiveTab("barcode")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "barcode" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Barcode className="w-4 h-4" /> Barcode
          </button>
        </div>
      </div>
      
      <div className={activeTab === "qr" ? "block" : "hidden"}>
        <QRGenerator />
      </div>
      <div className={activeTab === "barcode" ? "block" : "hidden"}>
        <BarcodeGenerator />
      </div>
    </div>
  )
}
