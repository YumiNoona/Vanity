import React, { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CATEGORIES, ALL_TOOLS } from "@/config/tools"
import type { Tool, Category } from "@/config/tools"
import { Link } from "react-router-dom"
import { ArrowRight, Zap, Search, Clock, Sparkles } from "lucide-react"
import { preloadTool, loaders } from "@/App"

const ToolCard = React.memo(function ToolCard({ 
  tool, 
  category, 
  onTrack 
}: { 
  tool: Tool, 
  category: Category, 
  onTrack: (id: string) => void 
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const Icon = tool.icon
  const isPopular = tool.isPopular
  const loader = loaders[tool.id as keyof typeof loaders]

  useEffect(() => {
    // Intent Detection: Preload if tool enters viewport and is popular/heavy
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (isPopular && loader) {
          preloadTool(loader)
        }
        observer.disconnect()
      }
    }, { threshold: 0.1 })

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [isPopular, loader])

  const handleMouseEnter = useCallback(() => {
    if (loader) {
      preloadTool(loader)
    }
  }, [loader])

  return (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Link
        to={tool.path}
        onClick={() => onTrack(tool.id)}
        onMouseEnter={handleMouseEnter}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl glass-panel p-8 shadow-sm transition-all hover:bg-white/[0.04] hover:-translate-y-1 h-full border-white/5 hover:border-white/10"
      >
        <div>
          <div className="mb-6 inline-flex items-center justify-between w-full">
            <div className={`inline-flex items-center justify-center rounded-xl bg-${category.color}/10 p-3.5 text-${category.color} group-hover:scale-110 transition-transform`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              {tool.isBulk && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Bulk</span>
                </div>
              )}
              {isPopular && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/10">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Popular</span>
                </div>
              )}
            </div>
          </div>
          <h3 className="mb-2 font-syne text-xl font-bold group-hover:text-primary transition-colors tracking-tight">{tool.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tool.description}
          </p>
        </div>
        
        <div className={`mt-8 flex items-center text-xs font-black uppercase tracking-widest text-${category.color}/70 group-hover:text-${category.color} transition-colors`}>
          Launch Tool <ArrowRight className="ml-2 h-3.5 w-3.5 transition-all group-hover:translate-x-1" />
        </div>
      </Link>
    </motion.div>
  )
})

export function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [recentToolIds, setRecentToolIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("recentTools")
    return saved ? JSON.parse(saved) : []
  })

  const trackToolClick = useCallback((toolId: string) => {
    setRecentToolIds(prev => {
      const updated = [toolId, ...prev.filter(id => id !== toolId)].slice(0, 5)
      localStorage.setItem("recentTools", JSON.stringify(updated))
      return updated
    })
  }, [])

  const recentTools = useMemo(() => {
    return recentToolIds
      .map(id => ALL_TOOLS.find(t => t.id === id))
      .filter(Boolean) as Tool[]
  }, [recentToolIds])

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
    <div className="mx-auto max-w-6xl pb-24 px-4 sm:px-6">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        >
          <Zap className="mr-2 h-4 w-4" /> v1.2 — Now with Smart Search
        </motion.div>
        
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-syne"
          >
            Every Tool You Need.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Always Free.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-[42rem] mx-auto text-muted-foreground sm:text-lg"
          >
            Privacy-first utilities for images, PDFs, developer tools, and video. All processing happens 100% in your browser. Zero server uploads.
          </motion.p>
        </div>

        {/* Smart Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl relative group"
        >
          <div className="absolute inset-0 bg-primary/10 blur-xl group-focus-within:bg-primary/20 transition-all rounded-2xl" />
          <div className="relative glass-panel rounded-2xl p-1.5 flex items-center shadow-2xl border-white/10 group-focus-within:border-primary/50 transition-all">
            <div className="pl-4 pr-3">
              <Search className="w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text"
              placeholder="Search tools... (e.g., 'resize image', 'compress pdf')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none py-3 text-lg font-medium placeholder:text-muted-foreground/50 h-14"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 self-center mr-2">Try:</span>
            {["resize", "compress", "qr", "format"].map(tag => (
              <button 
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="space-y-24">
        {/* Recently Used Section */}
        <AnimatePresence>
          {recentTools.length > 0 && !searchQuery && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-syne">Recently Used</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {recentTools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <motion.div key={tool.id}>
                      <Link
                        to={tool.path}
                        onClick={() => trackToolClick(tool.id)}
                        className="group relative flex flex-col items-center text-center glass-panel p-6 shadow-sm transition-all hover:bg-white/[0.06] hover:-translate-y-1"
                      >
                        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/5 p-4 text-primary group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-syne text-sm font-bold truncate w-full inline-flex items-center justify-center gap-2">
                          {tool.isBulk && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" title="Bulk tool" aria-label="Bulk tool" />}
                          {tool.title}
                        </h3>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {filteredCategories.map((category) => (
          <section key={category.id} id={category.id}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-syne flex items-center gap-3 underline decoration-primary/20 decoration-4 underline-offset-8">
                {category.title}
              </h2>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                {category.tools.length} available utilities
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  category={category} 
                  onTrack={trackToolClick} 
                />
              ))}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
          <div className="py-20 text-center animate-in fade-in duration-700">
            <p className="text-2xl font-syne font-bold text-muted-foreground/30 italic">No tools found matching your request</p>
          </div>
        )}
      </div>
      
      <div className="mt-32 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
        Privacy First • Local Processing • Zero Data Collection
      </div>
    </div>
  )
}

