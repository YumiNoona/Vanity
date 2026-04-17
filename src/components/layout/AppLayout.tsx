import React from "react"
import { Outlet } from "react-router-dom"
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

      <div className="fixed bottom-0 w-full z-40 bg-background border-t border-border/40">
        <AdSlot type="banner" />
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
