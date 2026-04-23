import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { FileSearch, Search, Hash, Copy, CheckCircle, Info, FileCode, FileJson, FileText, FileImage, FileAudio, FileVideo } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MIME_DB: Record<string, { mime: string; desc: string; icon: any }> = {
  "jpg": { mime: "image/jpeg", desc: "JPEG Image", icon: FileImage },
  "jpeg": { mime: "image/jpeg", desc: "JPEG Image", icon: FileImage },
  "png": { mime: "image/png", desc: "Portable Network Graphics", icon: FileImage },
  "gif": { mime: "image/gif", desc: "Graphics Interchange Format", icon: FileImage },
  "webp": { mime: "image/webp", desc: "WebP Image", icon: FileImage },
  "svg": { mime: "image/svg+xml", desc: "Scalable Vector Graphics", icon: FileCode },
  "json": { mime: "application/json", desc: "JSON Data", icon: FileJson },
  "js": { mime: "text/javascript", desc: "JavaScript File", icon: FileCode },
  "ts": { mime: "text/typescript", desc: "TypeScript File", icon: FileCode },
  "html": { mime: "text/html", desc: "HTML Document", icon: FileCode },
  "css": { mime: "text/css", desc: "CSS Stylesheet", icon: FileCode },
  "pdf": { mime: "application/pdf", desc: "Portable Document Format", icon: FileText },
  "zip": { mime: "application/zip", desc: "ZIP Archive", icon: Hash },
  "mp4": { mime: "video/mp4", desc: "MPEG-4 Video", icon: FileVideo },
  "mp3": { mime: "audio/mpeg", desc: "MP3 Audio", icon: FileAudio },
  "wav": { mime: "audio/wav", desc: "WAVE Audio", icon: FileAudio },
  "csv": { mime: "text/csv", desc: "Comma-Separated Values", icon: FileText },
  "txt": { mime: "text/plain", desc: "Plain Text File", icon: FileText },
  "xml": { mime: "application/xml", desc: "XML Data", icon: FileCode },
  "yaml": { mime: "application/x-yaml", desc: "YAML Data", icon: FileCode },
}

export function MimeLookup() {
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const results = Object.entries(MIME_DB).filter(([ext, data]) => 
    ext.includes(query.toLowerCase()) || 
    data.mime.includes(query.toLowerCase()) ||
    data.desc.toLowerCase().includes(query.toLowerCase())
  )

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
    toast.success("MIME type copied")
  }

  return (
    <ToolLayout
      title="MIME Type Lookup"
      description="Quickly find MIME types for file extensions or vice versa using our extensive local database."
      icon={FileSearch}
    >
      <div className="space-y-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-6">
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <input 
                 type="text" 
                 value={query} 
                 onChange={e => setQuery(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-6 text-2xl font-bold focus:border-primary/50 outline-none transition-all"
                 placeholder="Search extension (e.g. png) or MIME type (e.g. application/json)..."
              />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {results.length > 0 ? results.map(([ext, data]) => (
             <button
               key={ext}
               onClick={() => handleCopy(data.mime)}
               className="group glass-panel p-6 rounded-2xl border border-white/5 bg-black/20 text-left hover:border-primary/30 transition-all space-y-4 relative overflow-hidden"
             >
                <div className="flex items-center justify-between">
                   <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <data.icon className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary">.{ext}</span>
                </div>
                <div>
                   <p className="text-sm font-bold text-white mb-1">{data.desc}</p>
                   <p className="text-xs font-mono text-muted-foreground group-hover:text-white transition-colors">{data.mime}</p>
                </div>
                {copied === data.mime ? (
                  <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center animate-in fade-in duration-200">
                     <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                ) : (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Copy className="w-4 h-4 text-primary" />
                  </div>
                )}
             </button>
           )) : (
             <div className="col-span-full py-20 text-center opacity-50 space-y-4">
                <FileSearch className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No matching MIME types found in our database.</p>
             </div>
           )}
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
           <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
           <p className="text-[10px] text-muted-foreground leading-relaxed">
             This database contains the most common MIME types used in web development and general computing. MIME (Multipurpose Internet Mail Extensions) types tell the browser how to handle a file based on its content type.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
