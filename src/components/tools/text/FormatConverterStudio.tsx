import React, { useState } from "react"
import { TomlJson } from "./TomlJson"
import { YamlJsonConverter } from "../dev/YamlJsonConverter"
import { CsvJsonConverter } from "./CsvJsonConverter"
import { ArrowLeftRight, FileJson, FileCode, Table } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { ToolLayout } from "@/components/layout/ToolLayout"

export function FormatConverterStudio() {
  const [activeTab, setActiveTab] = useState<"toml" | "yaml" | "csv">("toml")

  return (
    <ToolLayout 
      title="Data Converter Studio" 
      description="Consolidated suite for TOML, YAML, and CSV cross-format synchronization."
      icon={ArrowLeftRight}
      centered={true}
    >
      <div className="relative animate-in fade-in duration-500">
        <div className="flex justify-center relative z-10 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <PillToggle
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            options={[
              { id: "toml", label: "TOML", icon: FileCode },
              { id: "yaml", label: "YAML", icon: FileJson },
              { id: "csv", label: "CSV", icon: Table }
            ]}
          />
        </div>
        
        <div className={activeTab === "toml" ? "block" : "hidden"}>
          <TomlJson embedded={true} />
        </div>
        <div className={activeTab === "yaml" ? "block" : "hidden"}>
          <YamlJsonConverter embedded={true} />
        </div>
        <div className={activeTab === "csv" ? "block" : "hidden"}>
          <CsvJsonConverter embedded={true} />
        </div>
      </div>
    </ToolLayout>
  )
}
