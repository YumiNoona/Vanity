import React, { useState } from "react"
import { ImageWatermark } from "./ImageWatermark"
import { WatermarkRemover } from "./WatermarkRemover"
import { Stamp, Eraser } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function WatermarkStudio() {
  const [activeTab, setActiveTab] = useState<"add" | "remove">("add")

  return (
    <ToolLayout 
      title="Branding Studio" 
      description="Professional watermark management and object removal suite."
      icon={Stamp}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center pt-6 pb-2 relative z-10 w-full mb-8">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "add", label: "Add Watermark", icon: Stamp },
              { id: "remove", label: "Remove Watermark", icon: Eraser }
            ]}
          />
        </div>
        
        <div className={activeTab === "add" ? "block" : "hidden"}>
          <ImageWatermark embedded={true} />
        </div>
        <div className={activeTab === "remove" ? "block" : "hidden"}>
          <WatermarkRemover embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}
