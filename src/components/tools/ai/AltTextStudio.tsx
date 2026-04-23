import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AiAltTextWriter } from "./AiAltTextWriter"
import { AltTextBatch } from "./AltTextBatch"
import { BrainCircuit, Images } from "lucide-react"

export function AltTextStudio() {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single")

  return (
    <div className="relative animate-in fade-in duration-500 min-h-[600px]">
      <div className="flex justify-center pt-6 pb-8 relative z-10">
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl isolate">
          <button 
            onClick={() => setActiveTab("single")}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 ${activeTab === "single" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="relative z-10 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Single Image
            </span>
            {activeTab === "single" && (
              <motion.div
                layoutId="altTextMode"
                className="absolute inset-0 bg-primary rounded-full shadow-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                style={{ zIndex: 0 }}
              />
            )}
          </button>
          <button 
            onClick={() => setActiveTab("batch")}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 ${activeTab === "batch" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="relative z-10 flex items-center gap-2">
              <Images className="w-4 h-4" /> Batch Process
            </span>
            {activeTab === "batch" && (
              <motion.div
                layoutId="altTextMode"
                className="absolute inset-0 bg-primary rounded-full shadow-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                style={{ zIndex: 0 }}
              />
            )}
          </button>
        </div>
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
