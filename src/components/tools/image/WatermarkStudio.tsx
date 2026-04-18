import React, { useState } from "react"
import { ImageWatermark } from "./ImageWatermark"
import { WatermarkRemover } from "./WatermarkRemover"
import { Stamp, Eraser } from "lucide-react"

export function WatermarkStudio() {
  const [activeTab, setActiveTab] = useState<"add" | "remove">("add")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10">
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "add" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Stamp className="w-4 h-4" /> Add Watermark
          </button>
          <button 
            onClick={() => setActiveTab("remove")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "remove" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Eraser className="w-4 h-4" /> Remove Watermark
          </button>
        </div>
      </div>
      
      <div className={activeTab === "add" ? "block" : "hidden"}>
        <ImageWatermark />
      </div>
      <div className={activeTab === "remove" ? "block" : "hidden"}>
        <WatermarkRemover />
      </div>
    </div>
  )
}
