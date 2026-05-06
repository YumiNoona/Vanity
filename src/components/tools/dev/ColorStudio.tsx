import React, { useState } from "react"
import { ColorPicker } from "./ColorPicker"
import { CssGradient } from "./CssGradient"
import { Palette, Zap } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function ColorStudio() {
  const [activeTab, setActiveTab] = useState<"picker" | "gradient">("picker")

  return (
    <ToolLayout 
      title="Color Studio" 
      description="Professional color tools for developers and designers."
      icon={Palette}
      centered={true}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center relative z-10 mb-8">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "picker", label: "Color Picker", icon: Palette },
              { id: "gradient", label: "Gradient Builder", icon: Zap }
            ]}
          />
        </div>
        
        <div className={activeTab === "picker" ? "block" : "hidden"}>
          <ColorPicker embedded={true} />
        </div>
        <div className={activeTab === "gradient" ? "block" : "hidden"}>
          <CssGradient embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}
