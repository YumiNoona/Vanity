import React, { useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { Heart } from "lucide-react"
import { Toaster } from "sonner"
import { DonateModal } from "./DonateModal"
import { ContactModal } from "./ContactModal"
import { ALL_TOOLS } from "@/config/tools"

export function AppLayout() {
  const [isDonateOpen, setIsDonateOpen] = React.useState(false)
  const [isContactOpen, setIsContactOpen] = React.useState(false)
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
    <div className="h-screen w-full flex flex-col overflow-hidden overflow-x-hidden relative bg-background">
      <div className="gradient-ambient" />
      <div className="noise-bg" />
      
      <Navbar onDonateOpen={() => setIsDonateOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto min-h-full flex flex-col">
             <div className="flex-1">
                <Outlet />
             </div>
             
             <footer className="mt-auto pt-10 pb-4">
               <div className="flex flex-col lg:flex-row items-center justify-between py-6 text-xs text-muted-foreground gap-6">
                 {/* Copyright */}
                 <div className="lg:w-1/4">
                   <p>© {new Date().getFullYear()} Vanity. All rights reserved.</p>
                 </div>

                 {/* Unified Support Bar Design */}
                 <div className="flex items-center gap-4 px-6 md:px-10 py-3 bg-white/5 border border-white/10 rounded-full relative group hover:border-primary/20 transition-all">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <Heart className="h-4 w-4 fill-primary/20" />
                   </div>
                   <div className="flex flex-col text-left">
                     <span className="font-bold text-foreground">Support Our Service</span>
                     <span className="text-[10px] opacity-70">If you like Vanity, please consider donating to keep it forever free.</span>
                   </div>
                   <button 
                     onClick={() => setIsDonateOpen(true)}
                     className="ml-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                   >
                     DONATE
                   </button>
                 </div>

                 {/* Links */}
                 <div className="flex items-center lg:justify-end gap-6 lg:w-1/4">
                   <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                   <button 
                     onClick={() => setIsContactOpen(true)}
                     className="hover:text-foreground transition-colors"
                   >
                     Contact
                   </button>
                 </div>
               </div>
             </footer>
          </div>
        </main>
      </div>

      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
