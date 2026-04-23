import React, { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileDown, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModeToggleProps {
  mode: 'single' | 'batch'
  onChange: (mode: 'single' | 'batch') => void
  disabled?: boolean
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/5 shadow-2xl backdrop-blur-sm isolate">
        <button
          onClick={() => onChange('single')}
          disabled={disabled}
          className={cn(
            "relative flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-300",
            mode === 'single' ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
          )}
        >
          <span className="relative z-10 flex items-center gap-2.5">
            <FileDown className="w-4 h-4" />
            Single Image
          </span>
          {mode === 'single' && (
            <motion.div
              layoutId="modeToggleBackground"
              className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              style={{ zIndex: 0 }}
            />
          )}
        </button>

        <button
          onClick={() => onChange('batch')}
          disabled={disabled}
          className={cn(
            "relative flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-300",
            mode === 'batch' ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
          )}
        >
          <span className="relative z-10 flex items-center gap-2.5">
            <Layers className="w-4 h-4" />
            Batch Process
          </span>
          {mode === 'batch' && (
            <motion.div
              layoutId="modeToggleBackground"
              className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              style={{ zIndex: 0 }}
            />
          )}
        </button>
      </div>
    </div>
  )
}
