import React, { useState } from "react"
import { UnitConverter } from "./UnitConverter"
import { CssUnitConverter } from "../dev/CssUnitConverter"
import { ArrowLeftRight, Scissors } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function UnitStudio() {
  const [activeTab, setActiveTab] = useState<"math" | "css">("math")

  return (
    <ToolLayout 
      title="Unit Studio" 
      description="Universal and CSS unit conversion tools."
      icon={ArrowLeftRight}
      centered={true}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center relative z-10 mb-8">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "math", label: "Universal Units", icon: ArrowLeftRight },
              { id: "css", label: "CSS Units", icon: Scissors }
            ]}
          />
        </div>
        
        <div className={activeTab === "math" ? "block" : "hidden"}>
          <UnitConverter embedded={true} />
        </div>
        <div className={activeTab === "css" ? "block" : "hidden"}>
          <CssUnitConverter embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}
