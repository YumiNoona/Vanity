import React, { useState } from "react"
import { Base64Tool } from "./Base64Tool"
import { Type, FileCode, Database } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function Base64Studio() {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text")

  return (
    <ToolLayout 
      title="Base64 Studio" 
      description="Universal encoder and decoder for text and binary data."
      icon={Database}
      centered={true}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center pt-6 pb-2 relative z-10 w-full px-4 mb-8">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "text", label: "Text", icon: Type },
              { id: "file", label: "File", icon: FileCode }
            ]}
          />
        </div>
        
        <div className={(activeTab === "text" || activeTab === "file") ? "block" : "hidden"}>
          <Base64Tool embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}
