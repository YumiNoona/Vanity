import React from "react"
import { motion } from "framer-motion"
import { IMAGE_TOOLS, PDF_TOOLS } from "@/config/tools"
import { Link } from "react-router-dom"
import { ArrowRight, ShieldCheck, Zap, ServerOff } from "lucide-react"

export function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
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
          className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-syne"
        >
          Every Tool You Need.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Always Free.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-[42rem] text-muted-foreground sm:text-xl sm:leading-8"
        >
          Image editing, PDF tools, format conversion — all in your browser. Zero uploads to any server. Your files stay exactly where they belong: on your device.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground font-medium"
        >
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> 11 Tools</div>
          <div className="flex items-center gap-2"><ServerOff className="h-4 w-4 text-green-500" /> No Server Upload</div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Fully Private</div>
        </motion.div>
      </div>

      <div className="space-y-16">
        {/* Image Tools */}
        <section>
          <h2 className="mb-8 text-2xl font-bold font-syne flex items-center gap-2">
            <span className="w-8 h-1 rounded-full bg-primary inline-block"></span>
            Image Tools
          </h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {IMAGE_TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <motion.div key={tool.id} variants={itemVariants}>
                  <Link
                    to={tool.path}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl glass-panel p-6 shadow-sm transition-all hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    
                    <div>
                      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-syne text-xl font-bold">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    
                    <div className="mt-6 flex items-center text-sm font-semibold text-primary">
                      Open Tool <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* PDF Tools */}
        <section>
          <h2 className="mb-8 text-2xl font-bold font-syne flex items-center gap-2">
            <span className="w-8 h-1 rounded-full bg-accent inline-block"></span>
            PDF Tools
          </h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {PDF_TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <motion.div key={tool.id} variants={itemVariants}>
                  <Link
                    to={tool.path}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl glass-panel p-6 shadow-sm transition-all hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(252,211,77,0.1)] hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    
                    <div>
                      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-syne text-xl font-bold">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    
                    <div className="mt-6 flex items-center text-sm font-semibold text-accent">
                      Open Tool <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </section>
      </div>
    </div>
  )
}
