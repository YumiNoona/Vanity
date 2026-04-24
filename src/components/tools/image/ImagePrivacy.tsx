import React, { useState } from "react"
import { ExifSanitizer } from "./ExifSanitizer"
import { IccStripper } from "./IccStripper"
import { ShieldCheck, PaintBucket } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"


export function ImagePrivacy() {
  const [activeTab, setActiveTab] = useState<"exif" | "icc">("exif")

  return (
    <div className="relative animate-in fade-in duration-500">
      <div className="flex justify-center pt-6 pb-2 relative z-10">
        <PillToggle
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          options={[
            { id: "exif", label: "EXIF Sanitizer", icon: ShieldCheck },
            { id: "icc", label: "ICC Stripper", icon: PaintBucket }
          ]}
        />
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
