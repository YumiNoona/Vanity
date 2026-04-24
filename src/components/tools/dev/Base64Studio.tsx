import React, { useState } from "react"
import { Base64Tool } from "./Base64Tool"
import { ImageToBase64 } from "../image/ImageToBase64"
import { Type, Image as ImageIcon, FileCode } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"

export function Base64Studio() {
  const [activeTab, setActiveTab] = useState<"text" | "image" | "file">("text")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10 w-full px-4">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: "text", label: "Text", icon: Type },
            { id: "image", label: "Image", icon: ImageIcon },
            { id: "file", label: "File", icon: FileCode }
          ]}
        />
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
