import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Tab<T> {
  id: T
  label: string | number
  icon?: any
}

interface AnimatedTabsProps<T extends string | number> {
  tabs: Tab<T>[]
  activeTab: T
  onChange: (id: T) => void
  className?: string
  layoutId?: string
}

export function AnimatedTabs<T extends string | number>({ 
  tabs, 
  activeTab, 
  onChange, 
  className,
  layoutId = "activeTab" 
}: AnimatedTabsProps<T>) {
  return (
    <div className={cn("flex bg-white/5 p-1 rounded-xl border border-white/5 relative isolate", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex-1 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
            activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
          )}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-primary rounded-lg shadow-lg"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              style={{ zIndex: 0 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
