import React, { useState } from "react"
import { QRGenerator } from "./QRGenerator"
import { BarcodeGenerator } from "./BarcodeGenerator"
import { QrCode, Barcode } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"

export function CodeGenerator() {
  const [activeTab, setActiveTab] = useState<"qr" | "barcode">("qr")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10 w-full mb-8">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: "qr", label: "QR Code", icon: QrCode },
            { id: "barcode", label: "Barcode", icon: Barcode }
          ]}
        />
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
