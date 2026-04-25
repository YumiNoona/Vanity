import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PillOption<T extends string | number> {
  id: T
  label: string
  icon?: React.ElementType
}

interface PillToggleProps<T extends string | number> {
  options: PillOption<T>[]
  activeId: T
  onChange: (id: T) => void
  className?: string
}

export function PillToggle<T extends string | number>({ 
  options, 
  activeId, 
  onChange, 
  className 
}: PillToggleProps<T>) {
  return (
    <div className={cn("flex justify-center w-full", className)}>
      <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 inline-flex max-w-full">
        <div className="flex relative isolate w-full">
          {/* Animated Background Slider */}
          <motion.div 
            className="absolute bg-primary rounded-xl inset-y-0 z-0"
            initial={false}
            animate={{ 
              x: `${options.findIndex(o => o.id === activeId) * 100}%`,
              width: `${100 / options.length}%`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          
          {options.map((option) => {
            const Icon = option.icon
            const isActive = option.id === activeId
            
            return (
              <button 
                key={option.id}
                onClick={() => onChange(option.id)}
                className={cn(
                  "relative flex-1 py-3 text-xs md:text-sm font-bold transition-colors duration-300 z-10 flex items-center justify-center gap-2 px-6 whitespace-nowrap min-w-[80px]",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />}
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
