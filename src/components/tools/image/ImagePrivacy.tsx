import React, { useState } from "react"
import { ExifSanitizer } from "./ExifSanitizer"
import { IccStripper } from "./IccStripper"
import { ShieldCheck, PaintBucket } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"


export function ImagePrivacy() {
  const [activeTab, setActiveTab] = useState<"exif" | "icc">("exif")

  return (
    <ToolLayout 
      title="Privacy Vault" 
      description="Protect your identity by removing hidden metadata and device footprints."
      icon={ShieldCheck}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center relative z-10">
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
          <ExifSanitizer embedded={true} />
        </div>
        <div className={activeTab === "icc" ? "block" : "hidden"}>
          <IccStripper embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}
