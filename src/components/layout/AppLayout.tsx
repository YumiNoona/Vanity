import React from "react"
import { Outlet } from "react-router-dom"
import { Link } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { AdSlot } from "../shared/AdSlot"
import { Toaster } from "sonner"

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="gradient-ambient" />
      <div className="noise-bg" />
      
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-border/40 bg-card/50 backdrop-blur">
        <div className="container flex flex-col sm:flex-row items-center justify-between py-6 gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Vanity. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <a href="mailto:privacy@vanity.tools" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 w-full z-40 bg-background border-t border-border/40">
        <AdSlot type="banner" />
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
