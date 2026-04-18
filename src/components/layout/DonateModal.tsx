import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, Copy, CheckCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
  const [copied, setCopied] = useState(false)
  const upiId = "rushikeshingale2001@okicici"

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    toast.success("UPI ID copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl text-primary">
                <Heart className="h-8 w-8 fill-primary/20" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-syne text-white">Support Vanity</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  If you like our service, please consider donating to keep these tools free and privacy-focused for everyone.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                <div className="relative p-3 bg-white rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/Donate.jpeg" 
                    alt="Donate QR Code" 
                    className="w-72 h-72 object-contain"
                  />
                </div>
              </div>

              <div className="w-full space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Direct UPI Payment
                  </label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-4 group hover:border-primary/30 transition-all">
                    <code className="flex-1 text-sm font-mono text-primary truncate">
                      {upiId}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white"
                    >
                      {copied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed">
                  Every donation, no matter how small, helps cover hosting and AI API costs.
                  <br />
                  Thank you for your kindness!
                </p>
              </div>


            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
