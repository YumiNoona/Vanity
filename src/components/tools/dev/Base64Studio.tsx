import React, { useState } from "react"
import { Base64Tool } from "./Base64Tool"
import { ImageToBase64 } from "../image/ImageToBase64"
import { Type, Image as ImageIcon, FileCode } from "lucide-react"

export function Base64Studio() {
  const [activeTab, setActiveTab] = useState<"text" | "image" | "file">("text")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10 w-full px-4">
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-x-auto w-full sm:w-auto custom-scrollbar touch-pan-x">
          <button 
            onClick={() => setActiveTab("text")}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === "text" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Type className="w-4 h-4" /> Text
          </button>
          <button 
            onClick={() => setActiveTab("image")}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === "image" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ImageIcon className="w-4 h-4" /> Image
          </button>
          <button 
            onClick={() => setActiveTab("file")}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${activeTab === "file" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FileCode className="w-4 h-4" /> File
          </button>
        </div>
      </div>
      
      <div className={(activeTab === "text" || activeTab === "file") ? "block" : "hidden"}>
        <Base64Tool />
      </div>
      <div className={activeTab === "image" ? "block" : "hidden"}>
        <ImageToBase64 />
      </div>
    </div>
  )
}
