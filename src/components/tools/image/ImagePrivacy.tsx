import React, { useState } from "react"
import { ExifSanitizer } from "./ExifSanitizer"
import { IccStripper } from "./IccStripper"
import { ShieldCheck, PaintBucket } from "lucide-react"

export function ImagePrivacy() {
  const [activeTab, setActiveTab] = useState<"exif" | "icc">("exif")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10">
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <button 
            onClick={() => setActiveTab("exif")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "exif" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ShieldCheck className="w-4 h-4" /> EXIF Sanitizer
          </button>
          <button 
            onClick={() => setActiveTab("icc")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === "icc" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <PaintBucket className="w-4 h-4" /> ICC Stripper
          </button>
        </div>
      </div>
      
      <div className={activeTab === "exif" ? "block" : "hidden"}>
        <ExifSanitizer />
      </div>
      <div className={activeTab === "icc" ? "block" : "hidden"}>
        <IccStripper />
      </div>
    </div>
  )
}
