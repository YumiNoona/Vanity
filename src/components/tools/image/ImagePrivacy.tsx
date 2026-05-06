import React, { useState } from "react"
import { ExifSanitizer } from "./ExifSanitizer"
import { IccStripper } from "./IccStripper"
import { SmartCensor } from "./SmartCensor"
import { ShieldCheck, PaintBucket, ShieldAlert } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"


export function ImagePrivacy() {
  const [activeTab, setActiveTab] = useState<"exif" | "icc" | "censor">("exif")

  return (
    <ToolLayout 
      title="Privacy Vault" 
      description="Protect your identity by removing hidden metadata and device footprints."
      icon={ShieldCheck}
      centered={true}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center relative z-10 mb-8 mt-4">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "exif", label: "EXIF Sanitizer", icon: ShieldCheck },
              { id: "icc", label: "ICC Stripper", icon: PaintBucket },
              { id: "censor", label: "Smart Censor", icon: ShieldAlert }
            ]}
          />
        </div>
        
        <div className={activeTab === "exif" ? "block" : "hidden"}>
          <ExifSanitizer embedded={true} />
        </div>
        <div className={activeTab === "icc" ? "block" : "hidden"}>
          <IccStripper embedded={true} />
        </div>
        <div className={activeTab === "censor" ? "block" : "hidden"}>
          <SmartCensor embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}

