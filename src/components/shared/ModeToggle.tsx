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
  const containerRef = useRef<HTMLDivElement>(null)
  const singleRef = useRef<HTMLButtonElement>(null)
  const batchRef = useRef<HTMLButtonElement>(null)
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeRef = mode === 'single' ? singleRef : batchRef
    const container = containerRef.current
    if (!activeRef.current || !container) return

    const btn = activeRef.current
    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()

    setSliderStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    })
  }, [mode])

  return (
    <div className="flex justify-center mb-8">
      <div
        ref={containerRef}
        className="relative flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/5 shadow-2xl backdrop-blur-sm"
      >
        {/* Animated Background Slider */}
        <motion.div
          className="absolute inset-y-1.5 bg-primary rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]"
          initial={false}
          animate={{
            left: sliderStyle.left,
            width: sliderStyle.width,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        <button
          ref={singleRef}
          onClick={() => onChange('single')}
          disabled={disabled}
          className={cn(
            "relative z-10 flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-200",
            mode === 'single' ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
          )}
        >
          <FileDown className="w-4 h-4" />
          Single
        </button>

        <button
          ref={batchRef}
          onClick={() => onChange('batch')}
          disabled={disabled}
          className={cn(
            "relative z-10 flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-200",
            mode === 'batch' ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
          )}
        >
          <Layers className="w-4 h-4" />
          Bulk Mode
        </button>
      </div>
    </div>
  )
}
