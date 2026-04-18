import React from "react"
import { motion } from "framer-motion"
import { CATEGORIES } from "@/config/tools"
import { Link } from "react-router-dom"
import { ArrowRight, ShieldCheck, Zap, ServerOff } from "lucide-react"
import { preloadTool, loaders } from "@/App"

export function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        >
          <Zap className="mr-2 h-4 w-4" /> v1.0 is live — 100% Free
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-syne px-4"
        >
          Every Tool You Need.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Always Free.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-[42rem] text-muted-foreground sm:text-lg px-6"
        >
          Privacy-first utilities for images, PDFs, developer tools, and video. All processing happens 100% in your browser. Zero server uploads.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground font-medium"
        >
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> 30+ Tools</div>
          <div className="flex items-center gap-2"><ServerOff className="h-4 w-4 text-green-500" /> No Server Upload</div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Fully Private</div>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-24 px-4"
      >
        {CATEGORIES.map((category) => (
          <section key={category.id} id={category.id}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-syne flex items-center gap-3">
                <span className={`w-8 h-1 rounded-full bg-${category.color} inline-block`}></span>
                {category.title}
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                {category.tools.length} Tools
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => {
                const Icon = tool.icon
                const isPopular = (tool as any).isPopular
                const loader = loaders[tool.id as keyof typeof loaders]
                
                return (
                  <motion.div key={tool.id} variants={itemVariants}>
                    <Link
                      to={tool.path}
                      onMouseEnter={() => {
                        if (isPopular && loader) {
                          preloadTool(loader)
                        }
                      }}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-xl glass-panel p-6 shadow-sm transition-all hover:bg-white/[0.06] hover:-translate-y-1 h-full"
                    >
                      <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-${category.color}/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100`} />
                      
                      <div>
                        <div className="mb-4 inline-flex items-center justify-between w-full">
                          <div className={`inline-flex items-center justify-center rounded-lg bg-${category.color}/10 p-3 text-${category.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          {isPopular && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-${category.color}/10 text-${category.color} rounded`}>Popular</span>
                          )}
                        </div>
                        <h3 className="mb-2 font-syne text-lg font-bold group-hover:text-primary transition-colors">{tool.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                      
                      <div className={`mt-6 flex items-center text-sm font-semibold text-${category.color}`}>
                        Open Tool <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </section>
        ))}
      </motion.div>
    </div>
  )
}

