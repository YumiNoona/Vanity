import React, { useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { AdSlot } from "../shared/AdSlot"
import { Toaster } from "sonner"
import { ALL_TOOLS } from "@/config/tools"

export function AppLayout() {
  const location = useLocation()

  useEffect(() => {
    const currentTool = ALL_TOOLS.find(t => t.path === location.pathname)
    if (currentTool) {
      document.title = `${currentTool.title} | Vanity`
      // Update meta description dynamically
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute("content", currentTool.description)
      }
    } else if (location.pathname === "/") {
      document.title = "Vanity — Every Tool You Need. Always Free."
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute("content", "Privacy-first utilities for images, PDFs, developer tools, and video. 100% browser-based. Zero server uploads.")
      }
    } else {
      document.title = "Vanity"
    }
  }, [location.pathname])

  return (
    <div className="h-screen flex flex-col overflow-hidden relative bg-background">
      <div className="gradient-ambient" />
      <div className="noise-bg" />
      
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto min-h-full flex flex-col">
             <div className="flex-1">
                <Outlet />
             </div>
             
             <footer className="mt-20 border-t border-border/40 bg-card/50 backdrop-blur rounded-2xl">
               <div className="flex flex-col sm:flex-row items-center justify-between py-6 px-8 gap-4 text-xs text-muted-foreground">
                 <p>© {new Date().getFullYear()} Vanity. All rights reserved.</p>
                 <div className="flex items-center gap-6">
                   <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                   <Link to="/privacy" className="hover:text-foreground transition-colors">Cookie Policy</Link>
                   <a href="mailto:privacy@vanity.tools" className="hover:text-foreground transition-colors">Contact</a>
                 </div>
               </div>
             </footer>
          </div>
        </main>
      </div>

      <div className="w-full z-40 bg-background border-t border-border/40">
        <AdSlot type="banner" />
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
