import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  File, 
  Trash2, 
  Clock,
  ArrowRight
} from "lucide-react"
import { cn, formatSize } from "@/lib/utils"
import type { QueueItem } from "@/types/bulk"

interface ProcessingQueueProps {
  items: QueueItem[]
  onRemove?: (id: string) => void
  disabled?: boolean
}

export function ProcessingQueue({ items, onRemove, disabled }: ProcessingQueueProps) {
  if (items.length === 0) return null

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Processing Queue ({items.length} items)
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/50">
          Sequential Batch 1.0
        </span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border-white/5 bg-black/20 shadow-inner">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-black/60 backdrop-blur-md">
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-white/5">
                <th className="px-6 py-4 font-bold">File Information</th>
                <th className="px-6 py-4 font-bold">Size Delta</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group transition-colors",
                      item.status === 'processing' ? "bg-primary/5" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          item.status === 'done' ? "bg-emerald-500/10 text-emerald-500" :
                          item.status === 'failed' ? "bg-red-500/10 text-red-500" :
                          item.status === 'processing' ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground"
                        )}>
                          <File className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white truncate max-w-[200px]">{item.file.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatSize(item.originalSize)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      {item.status === 'done' && item.resultSize ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-start px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] font-bold text-emerald-500">
                             {formatSize(item.resultSize)}
                            </span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground">
                            -{Math.round((1 - item.resultSize / item.originalSize) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30 font-mono italic">
                          {item.status === 'processing' ? "Calculating..." : "---"}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> Waiting
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Working
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <CheckCircle className="w-3 h-3" /> Ready
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                            {item.errorMessage && (
                              <span className="text-[8px] text-red-400/60 truncate max-w-[150px]">
                                {item.errorMessage}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' && onRemove && !disabled && (
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-bold text-primary">Pro Tip:</span> Bulk downloads are packaged into a single ZIP archive for efficiency. Your browser may briefly freeze when generating very large ZIPs (100MB+).
        </p>
      </div>
    </div>
  )
}
