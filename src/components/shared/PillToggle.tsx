import React from "react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option<T> {
  id: T
  label: string
  icon: LucideIcon
}

interface PillToggleProps<T> {
  options: Option<T>[]
  activeId: T
  onChange: (id: T) => void
  id?: string
  className?: string
}

export function PillToggle<T extends string>({ options, activeId, onChange, id = "default", className }: PillToggleProps<T>) {
  return (
    <div className={cn("flex justify-center mb-8", className)}>
      <div className="relative flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/5 shadow-2xl backdrop-blur-sm isolate">
        {options.map((option) => {
          const Icon = option.icon
          const isActive = activeId === option.id
          
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-300",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
              )}
            >
              <span className="relative z-10 flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                {option.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId={`pillToggleBackground-${id}`}
                  className="absolute inset-0 bg-primary rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: 0 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
