import React from "react"
import { Link, useLocation } from "react-router-dom"
import { IMAGE_TOOLS, PDF_TOOLS } from "@/config/tools"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const location = useLocation()

  const renderLinks = (tools: any[]) => {
    return tools.map((tool) => {
      const isActive = location.pathname === tool.path
      const Icon = tool.icon

      return (
        <Link
          key={tool.id}
          to={tool.path}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {tool.title}
        </Link>
      )
    })
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/40 bg-card hidden md:block">
      <div className="flex h-full flex-col overflow-y-auto py-6 px-4">
        <div className="mb-8">
          <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-syne">
            Image Tools
          </h4>
          <div className="space-y-1">{renderLinks(IMAGE_TOOLS)}</div>
        </div>

        <div className="mb-8">
          <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground font-syne">
            PDF Tools
          </h4>
          <div className="space-y-1">{renderLinks(PDF_TOOLS)}</div>
        </div>
      </div>
    </aside>
  )
}
