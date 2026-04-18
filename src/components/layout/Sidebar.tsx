import React, { useState, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { CATEGORIES } from "@/config/tools"
import type { Tool } from "@/config/tools"
import { cn } from "@/lib/utils"
import { Search, ChevronDown, ChevronRight, X } from "lucide-react"

export function Sidebar() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (id: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES

    const query = searchQuery.toLowerCase()
    return CATEGORIES.map(cat => ({
      ...cat,
      tools: cat.tools.filter(tool => 
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords?.some(k => k.toLowerCase().includes(query))
      )
    })).filter(cat => cat.tools.length > 0)
  }, [searchQuery])

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/40 bg-card hidden md:block">
      <div className="flex h-full flex-col overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-border/40">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-border/40 rounded-lg py-1.5 pl-9 pr-8 text-xs outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-sm"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          {filteredCategories.map((category) => {
            const isCollapsed = collapsedCategories[category.id]
            
            return (
              <div key={category.id} className="mb-6 last:mb-0">
                <button 
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between w-full px-3 mb-2 group text-left"
                >
                  <h4 className="flex-1 text-[10px] pr-2 font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
                    {category.title}
                  </h4>
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                  )}
                </button>
                
                {!isCollapsed && (
                  <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {category.tools.map((tool) => {
                      const isActive = location.pathname === tool.path
                      const Icon = tool.icon

                      return (
                        <Link
                          key={tool.id}
                          to={tool.path}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all group/link",
                            isActive
                              ? "bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]"
                              : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5 transition-transform group-hover/link:scale-110", isActive ? "text-primary" : "text-muted-foreground/70")} />
                          {tool.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {filteredCategories.length === 0 && (
            <div className="py-20 text-center animate-in fade-in duration-500">
              <p className="text-xs text-muted-foreground italic font-syne">No tools found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
