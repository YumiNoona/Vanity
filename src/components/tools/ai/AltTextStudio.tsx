import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PillToggle } from "@/components/shared/PillToggle"
import { AiAltTextWriter } from "./AiAltTextWriter"
import { AltTextBatch } from "./AltTextBatch"
import { BrainCircuit, Images } from "lucide-react"

export function AltTextStudio() {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single")

  return (
    <div className="relative animate-in fade-in duration-500 min-h-[600px]">
      <div className="flex justify-center pt-6 pb-8 relative z-10">
        <PillToggle
          activeId={activeTab}
          onChange={setActiveTab}
          options={[
            { id: "single", label: "Single Image", icon: BrainCircuit },
            { id: "batch", label: "Batch Process", icon: Images },
          ]}
        />
      </div>
      
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "single" ? (
            <motion.div
              key="single"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AiAltTextWriter />
            </motion.div>
          ) : (
            <motion.div
              key="batch"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AltTextBatch />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
