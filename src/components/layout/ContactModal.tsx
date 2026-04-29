import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Copy, CheckCircle, MessageSquare, Lightbulb, HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const email = "rushikeshingale2001@gmail.com"
  const { isCopied, copy } = useCopyToClipboard()

  const handleCopy = () => {
    copy(email, "Email copied to clipboard!")
  }

  const contactOptions = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      title: "Feedback",
      description: "Tell us what you love or what we can improve."
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      title: "Tool Ideas",
      description: "Have a tool in mind? Let's build it together."
    },
    {
      icon: <HelpCircle className="h-4 w-4" />,
      title: "General Questions",
      description: "Any other questions? Just ask away."
    }
  ]

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

            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl text-primary">
                <Mail className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-syne text-white">Get in Touch</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Have feedback, a tool idea, or just want to say hi? We'd love to hear from you.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                {contactOptions.map((option, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/[0.08] transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-xl text-primary mt-0.5">
                      {option.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{option.title}</h4>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full space-y-4 pt-4 border-t border-white/10">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-4 group hover:border-primary/30 transition-all">
                    <code className="flex-1 text-sm font-mono text-primary truncate">
                      {email}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white"
                    >
                      {isCopied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <a 
                  href={`mailto:${email}`}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send an Email
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
