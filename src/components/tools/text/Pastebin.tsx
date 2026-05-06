import React, { useState, useEffect, useCallback, useRef } from "react"
import { 
  Share2, Link as LinkIcon, CheckCircle, Copy, Lock, Unlock, 
  FileUp, Shield, ShieldCheck, Eye, EyeOff, AlertTriangle, 
  ExternalLink, Globe, LockKeyhole, Clock, Code, Type, 
  ChevronDown, QrCode as QrCodeIcon, Plus, Info, File, Folder,
  HardDrive, Loader2, FolderArchive, Download, Send, Inbox,
  Pencil, ArrowRight, Search, Trash2
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import QRCode from "qrcode"

const LANGUAGES = [
  { id: "plain", label: "Plain Text" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "json", label: "JSON" },
  { id: "markdown", label: "Markdown" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "sql", label: "SQL" },
  { id: "bash", label: "Bash" },
  { id: "rust", label: "Rust" },
  { id: "go", label: "Go" },
  { id: "cpp", label: "C++" },
  { id: "php", label: "PHP" },
  { id: "ruby", label: "Ruby" },
  { id: "java", label: "Java" },
]

const EXPIRIES = [
  { id: "hour", label: "1 Hour", seconds: 3600 },
  { id: "1", label: "1 Day", seconds: 86400 },
  { id: "7", label: "7 Days", seconds: 604800 },
  { id: "30", label: "30 Days", seconds: 2592000 },
  { id: "365", label: "Never", seconds: "never" },
]

type PasteTab = "text" | "file" | "folder"

export function Pastebin() {
  const [mode, setMode] = useState<"send" | "receive">("send")
  const [activeTab, setActiveTab] = useState<PasteTab>("text")
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState("plain")
  const [expiry, setExpiry] = useState("1")
  const [visibility, setVisibility] = useState<"public" | "private">("private")
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view")
  
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [qrUrl, setQrUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReadView, setIsReadView] = useState(false)

  // Receive mode state
  const [receiveUrl, setReceiveUrl] = useState("")
  const [receivedContent, setReceivedContent] = useState("")
  const [receivedTitle, setReceivedTitle] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // File/Folder Upload State
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFolderFiles, setSelectedFolderFiles] = useState<FileList | null>(null)
  
  const { isCopied, copy } = useCopyToClipboard()

  // Load from URL on mount
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      if (hash) {
        setIsReadView(true)
        if (hash.startsWith("enc:")) {
          setIsLocked(true)
          setIsEncrypted(true)
        } else if (hash.startsWith("ext:")) {
          decodeContent(hash)
        } else {
          decodeContent(hash)
        }
        setShareUrl(window.location.href)
      }
    }
  }, [])

  // Update QR when shareUrl changes
  useEffect(() => {
    const generateQr = async () => {
      if (!shareUrl) {
        setQrUrl("")
        return
      }

      let urlToQr = shareUrl
      
      // If URL is too long (causing dense dots), try to shorten it for the QR only
      if (shareUrl.length > 120) {
        try {
          const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(shareUrl)}`)}`)
          if (response.ok) {
            const short = await response.text()
            if (short && short.startsWith('https://')) {
              urlToQr = short
            }
          }
        } catch (e) {
          console.warn("QR Shortening failed, using long URL")
        }
      }

      QRCode.toDataURL(urlToQr, {
        margin: 1,
        width: 600,
        errorCorrectionLevel: 'L',
        color: {
          dark: "#FFFFFF",
          light: "#00000000"
        }
      }).then(setQrUrl).catch(console.error)
    }

    generateQr()
  }, [shareUrl])

  const decodeContent = async (hash: string, pass?: string) => {
    try {
      const { default: LZString } = await import("lz-string")
      let raw = hash
      
      if (hash.startsWith("enc:")) {
        if (!pass) return
        const CryptoJS = (await import("crypto-js")).default
        const encrypted = hash.substring(4)
        try {
          const bytes = CryptoJS.AES.decrypt(encrypted, pass)
          raw = bytes.toString(CryptoJS.enc.Utf8)
          if (!raw) throw new Error("Invalid password")
          
          // Bug 2 Fix: Use decompress for encrypted strings if we compressed them without URI encoding
          // For backward compatibility, we check if it fails and try the URI version
          const decompressed = LZString.decompress(raw) || LZString.decompressFromEncodedURIComponent(raw)
          if (decompressed) {
            setContent(decompressed)
            setIsLocked(false)
            setIsEncrypted(true)
            if (pass) setPassword(pass)
            toast.success("Content Decrypted!")
          } else {
            throw new Error("Decompression failed")
          }
        } catch (e) {
          toast.error("Decryption failed. Check your password.")
          return
        }
      } else if (hash.startsWith("ext:")) {
        // Remote file sharing (Public integrated)
        const params = new URLSearchParams(hash.substring(4))
        const remoteUrl = params.get("remote")
        if (remoteUrl) {
          try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(remoteUrl)}`)
            if (response.ok) {
              const text = await response.text()
              setContent(text)
              if (params.get("title")) setTitle(params.get("title") || "")
              if (params.get("lang")) setLanguage(params.get("lang") || "plain")
              setIsLocked(false)
              setIsEncrypted(false)
            }
          } catch (e) {
            toast.error("Failed to fetch remote content")
          }
        }
      } else {
        const decompressed = LZString.decompressFromEncodedURIComponent(raw)
        if (decompressed) {
          setContent(decompressed)
          setIsLocked(false)
          setIsEncrypted(false)
        }
      }
    } catch (e) {
      toast.error("Failed to decode content")
    }
  }

  const uploadToNullPointer = (file: File | Blob, fileName: string) => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", file, fileName)

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve(xhr.responseText.trim())
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener("error", () => reject(new Error("Network error during upload")))
      
      xhr.open("POST", `https://corsproxy.io/?${encodeURIComponent("https://0x0.st")}`)
      xhr.send(formData)
    })
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return
    if (selectedFile.size > 512 * 1024 * 1024) {
      toast.error("File exceeds 512MB limit")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const url = await uploadToNullPointer(selectedFile, selectedFile.name)
      setShareUrl(url)
      toast.success("File uploaded to 0x0.st!")
    } catch (e) {
      toast.error("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFolderUpload = async () => {
    if (!selectedFolderFiles || selectedFolderFiles.length === 0) return
    
    setIsUploading(true)
    setUploadProgress(0)
    toast.info("Compressing folder...")

    try {
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()
      
      for (let i = 0; i < selectedFolderFiles.length; i++) {
        const file = selectedFolderFiles[i]
        const path = (file as any).webkitRelativePath || file.name
        zip.file(path, file)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      toast.info("Uploading ZIP archive...")
      
      const zipName = (selectedFolderFiles[0] as any).webkitRelativePath.split('/')[0] || "folder"
      const url = await uploadToNullPointer(zipBlob, `${zipName}.zip`)
      setShareUrl(url)
      toast.success("Folder zipped and uploaded!")
    } catch (e) {
      toast.error("Zipping/Upload failed")
      console.error(e)
    } finally {
      setIsUploading(false)
    }
  }

  const generateShareLink = async () => {
    if (!content.trim()) return
    setIsGenerating(true)

    try {
      const { default: LZString } = await import("lz-string")
      
      if (visibility === "public") {
        let shortUrl = ""
        const expirySeconds = EXPIRIES.find(e => e.id === expiry)?.seconds || 86400

        // Attempt 1: dpaste.org (Anonymous API)
        try {
          const formData = new FormData()
          formData.append("content", content)
          formData.append("lexer", language === "plain" ? "text" : language)
          formData.append("format", "url")
          formData.append("expires", expirySeconds.toString())
          
          const response = await fetch(`https://corsproxy.io/?${encodeURIComponent("https://dpaste.org/api/")}`, {
            method: "POST",
            body: formData,
          })
          
          if (response.ok) {
            shortUrl = (await response.text()).trim()
          }
        } catch (e) {
          console.warn("dpaste.org failed, falling back to ix.io...", e)
        }

        // Attempt 2: ix.io fallback
        if (!shortUrl) {
          try {
             const formData = new FormData()
             formData.append("f:1", content)
             const response = await fetch(`https://corsproxy.io/?${encodeURIComponent("http://ix.io")}`, { 
               method: "POST", 
               body: formData 
             })
             if (response.ok) shortUrl = (await response.text()).trim()
          } catch (e) {
             console.warn("ix.io failed, falling back to integrated upload...")
          }
        }

        // Attempt 3: Integrated 0x0.st + Vanity Wrapper (Reliable & Branded)
        if (!shortUrl) {
          const textBlob = new Blob([content], { type: 'text/plain' })
          const remoteUrl = await uploadToNullPointer(textBlob, `${title || "paste"}.txt`)
          
          const params = new URLSearchParams()
          params.set("remote", remoteUrl)
          if (title) params.set("title", title)
          params.set("lang", language)
          
          const finalHash = `ext:${params.toString()}`
          const newUrl = `${window.location.pathname}${window.location.search}#${finalHash}`
          window.history.replaceState(null, "", newUrl)
          setShareUrl(window.location.origin + newUrl)
        } else {
          setShareUrl(shortUrl)
        }
        
        setIsEncrypted(false)
        toast.success("Public link generated!")
      } else {
        // Private URL-based logic (Self-contained in hash)
        let compressed;
        let finalHash;

        if (password) {
          compressed = LZString.compress(content)
          const CryptoJS = (await import("crypto-js")).default
          const encrypted = CryptoJS.AES.encrypt(compressed, password).toString()
          finalHash = `enc:${encrypted}`
        } else {
          compressed = LZString.compressToEncodedURIComponent(content)
          finalHash = compressed
        }

        const newUrl = `${window.location.pathname}${window.location.search}#${finalHash}`
        window.history.replaceState(null, "", newUrl)
        setShareUrl(window.location.origin + newUrl)
        setIsEncrypted(!!password)
        toast.success(password ? "Secure encrypted link ready!" : "Private link generated!")
      }
    } catch (e) {
      console.error(e)
      toast.error("Generation failed. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePasteFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (visibility === "private" && file.size > 1024 * 500) { 
       toast.error("File too large for Private mode (500KB limit).")
       return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setContent(ev.target?.result as string)
      setShareUrl("")
      toast.success(`Loaded ${file.name}`)
    }
    reader.readAsText(file)
  }

  const handleUnlock = () => {
    const hash = window.location.hash.substring(1)
    decodeContent(hash, password)
  }

  const highlight = (code: string) => {
    if (!code) return ""
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    
    if (language === "json") {
      return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-blue-400'
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'text-amber-400 font-bold' : 'text-emerald-400'
        } else if (/true|false/.test(match)) {
          cls = 'text-orange-400'
        } else if (/null/.test(match)) {
          cls = 'text-gray-400'
        }
        return `<span class="${cls}">${match}</span>`
      })
    }
    
    return escaped
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-emerald-400">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|try|catch|finally|async|await|type|interface|public|private|static|void)\b/g, '<span class="text-amber-400 font-bold">$1</span>')
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-white/30 italic">$1</span>')
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const fetchRemoteContent = async () => {
    if (!receiveUrl.trim()) return
    setIsFetching(true)
    setReceivedContent("")
    setReceivedTitle("")
    try {
      // Check if it's a Vanity hash link
      if (receiveUrl.includes("#")) {
        const hash = receiveUrl.split("#")[1]
        if (hash) {
          await decodeContent(hash)
          setReceivedContent(content)
          setReceivedTitle(title || "Shared Paste")
          setIsFetching(false)
          return
        }
      }
      // Otherwise fetch raw URL content via proxy
      const url = receiveUrl.startsWith("http") ? receiveUrl : `https://${receiveUrl}`
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const text = await response.text()
      setReceivedContent(text)
      setReceivedTitle(new URL(url).pathname.split("/").pop() || "Remote Content")
      toast.success("Content loaded!")
    } catch (e) {
      toast.error("Failed to fetch content from URL")
    } finally {
      setIsFetching(false)
    }
  }

  const downloadContent = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded!")
  }

  return (
    <ToolLayout title="Advanced Sharing" description="Share snippets, large files, or entire folders securely and instantly." icon={Share2} centered={true} maxWidth="max-w-7xl">
      <div className="space-y-6 pb-20">
        
        {/* Send / Receive Mode Toggle */}
        {!isReadView && (
          <div className="flex justify-center mb-4">
             <div className="glass-panel p-1 rounded-2xl border border-white/5 bg-black/60 flex w-full max-w-xs relative">
                <button 
                  onClick={() => { setMode("send"); setReceivedContent(""); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest relative z-10",
                    mode === "send" ? "text-white" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Send className="w-3.5 h-3.5" /> Send
                  {mode === "send" && (
                    <motion.div 
                      layoutId="mode-pill"
                      className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/30 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
                <button 
                  onClick={() => { setMode("receive"); setShareUrl(""); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest relative z-10",
                    mode === "receive" ? "text-white" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Inbox className="w-3.5 h-3.5" /> Receive
                  {mode === "receive" && (
                    <motion.div 
                      layoutId="mode-pill"
                      className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
             </div>
          </div>
        )}

        {/* Content Type Tabs (Send mode only) */}
        {!isReadView && mode === "send" && (
          <div className="flex justify-center mb-8">
             <div className="glass-panel p-1 rounded-2xl border border-white/5 bg-black/40 flex w-full max-w-md relative">
                {(["text", "file", "folder"] as PasteTab[]).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); setShareUrl(""); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest relative z-10",
                      activeTab === tab ? "text-white" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {tab === "text" && <Code className="w-3.5 h-3.5" />}
                    {tab === "file" && <File className="w-3.5 h-3.5" />}
                    {tab === "folder" && <Folder className="w-3.5 h-3.5" />}
                    {tab}
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="active-tab-pill"
                        className="absolute inset-0 bg-primary rounded-xl shadow-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* ===== RECEIVE MODE ===== */}
        {mode === "receive" && !isReadView && !isLocked && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* URL Input */}
             <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-black/20 space-y-6">
                <div className="text-center space-y-2">
                   <div className="p-4 bg-emerald-500/10 rounded-full w-fit mx-auto relative">
                      <Inbox className="w-10 h-10 text-emerald-400 relative z-10" />
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                   </div>
                   <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">Receive Content</h3>
                   <p className="text-sm text-muted-foreground">Paste any share link to view, edit, or download its content</p>
                </div>

                <div className="flex gap-3">
                   <div className="flex-1 relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        value={receiveUrl}
                        onChange={e => setReceiveUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchRemoteContent()}
                        placeholder="Paste URL or share link here..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-white/20"
                      />
                   </div>
                   <button 
                     onClick={fetchRemoteContent}
                     disabled={!receiveUrl.trim() || isFetching}
                     className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 flex items-center gap-2"
                   >
                     {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                     Fetch
                   </button>
                </div>
             </div>

             {/* Received Content View */}
             {receivedContent && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h2 className="text-xl font-black font-syne text-white uppercase tracking-tighter">{receivedTitle || "Received Content"}</h2>
                        <div className="flex gap-2">
                           <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase rounded">{receivedContent.length} chars</span>
                           <span className="px-2 py-0.5 bg-white/5 text-muted-foreground text-[9px] font-bold uppercase rounded">{receivedContent.split("\n").length} lines</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsEditing(!isEditing)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border",
                            isEditing ? "bg-primary text-white border-primary" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                          )}
                        >
                          <Pencil className="w-3 h-3" /> {isEditing ? "Editing" : "Edit"}
                        </button>
                        <button 
                          onClick={() => { setReceivedContent(""); setReceiveUrl(""); setIsEditing(false); }}
                          className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white rounded-xl border border-white/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>

                  {/* Content Panel */}
                  <div className="glass-panel rounded-[2.5rem] border border-white/5 bg-black/40 overflow-hidden min-h-[400px]">
                     {isEditing ? (
                       <textarea 
                         value={receivedContent}
                         onChange={e => setReceivedContent(e.target.value)}
                         className="w-full min-h-[400px] bg-transparent p-8 font-mono text-sm resize-none outline-none custom-scrollbar text-white/90"
                         spellCheck={false}
                       />
                     ) : (
                       <div className="p-8 font-mono text-sm leading-relaxed overflow-auto custom-scrollbar">
                          <pre className="text-white/90 whitespace-pre" dangerouslySetInnerHTML={{ __html: highlight(receivedContent) }} />
                       </div>
                     )}
                  </div>

                  {/* Action Bar */}
                  <div className="grid grid-cols-3 gap-3">
                     <button 
                       onClick={() => copy(receivedContent, "Content copied!")}
                       className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                     >
                       {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                     </button>
                     <button 
                       onClick={() => downloadContent(receivedContent, `${receivedTitle || "received"}.txt`)}
                       className="py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                     >
                       <Download className="w-3.5 h-3.5" /> Download
                     </button>
                     <button 
                       onClick={() => { setContent(receivedContent); setTitle(receivedTitle); setMode("send"); setReceivedContent(""); toast.success("Loaded into editor!"); }}
                       className="py-4 bg-primary/20 text-primary border border-primary/20 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-primary/30 transition-all"
                     >
                       <Send className="w-3.5 h-3.5" /> Re-Share
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* ===== SEND MODE ===== */}
        {mode === "send" && (
        <>
        {isLocked ? (
          <div className="glass-panel p-12 rounded-[3rem] border border-primary/20 bg-primary/5 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95">
             <div className="p-6 bg-primary/10 rounded-full relative">
               <Lock className="w-12 h-12 text-primary" />
               <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
             </div>
             <div className="text-center space-y-2">
               <h3 className="text-3xl font-black font-syne text-white uppercase tracking-tighter">Encrypted Paste</h3>
               <p className="text-sm text-muted-foreground">This content is protected with AES-256 encryption.<br/>Enter the decryption password to view.</p>
             </div>
             <div className="w-full max-w-sm space-y-4">
                <input 
                  type="password" 
                  placeholder="Enter Password..." 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-white outline-none focus:border-primary/50 transition-all font-mono"
                  autoFocus
                />
                <button 
                  onClick={handleUnlock}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Unlock Content
                </button>
             </div>
          </div>
        ) : isReadView ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <h2 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">{title || "Untitled Paste"}</h2>
                   <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded">{language}</span>
                      <span className="px-2 py-0.5 bg-white/5 text-muted-foreground text-[9px] font-bold uppercase rounded">{isEncrypted ? "AES-256" : "Public"}</span>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setIsReadView(false)
                    window.history.replaceState(null, "", window.location.pathname)
                    setShareUrl("")
                  }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                >
                   <Plus className="w-3.5 h-3.5" /> Create New
                </button>
             </div>

             <div className="glass-panel rounded-[2.5rem] border border-white/5 bg-black/40 overflow-hidden min-h-[500px]">
                <div className="p-8 font-mono text-sm leading-relaxed overflow-auto custom-scrollbar">
                   <pre 
                     className="text-white/90 whitespace-pre"
                     dangerouslySetInnerHTML={{ __html: highlight(content) }}
                   />
                </div>
             </div>

             <div className="flex justify-center pt-8">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 flex flex-col items-center gap-4">
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Share this link</p>
                   <div className="flex items-center gap-4 bg-black/40 p-2 pl-6 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-mono text-white/50 truncate max-w-[200px]">{shareUrl}</span>
                      <button 
                        onClick={() => copy(shareUrl, "Copied!")}
                        className="p-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all"
                      >
                         {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Panel */}
            <div className="lg:col-span-8 space-y-4">
               {activeTab === "text" && (
                 <div className="glass-panel rounded-[2.5rem] border border-white/5 bg-black/20 overflow-hidden flex flex-col min-h-[600px] group">
                    <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                         <input 
                           type="text" 
                           value={title}
                           onChange={e => { setTitle(e.target.value); setShareUrl(""); }}
                           placeholder="Paste Title (Optional)"
                           className="w-full bg-transparent border-none outline-none font-syne font-bold text-white/90 placeholder:text-white/20"
                         />
                      </div>
                      <div className="flex items-center gap-2">
                         <select 
                           value={language}
                           onChange={e => { setLanguage(e.target.value); setShareUrl(""); }}
                           className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-muted-foreground outline-none focus:border-primary/50 appearance-none pr-8 relative"
                           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                         >
                           {LANGUAGES.map(l => (
                             <option key={l.id} value={l.id} className="bg-[#121212]">{l.label}</option>
                           ))}
                         </select>
                         
                         <label className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all group/up">
                            <FileUp className="w-3 h-3 group-hover/up:-translate-y-0.5 transition-transform" />
                            <span className="text-[10px] font-bold uppercase">Upload</span>
                            <input type="file" className="hidden" onChange={handlePasteFileUpload} accept=".txt,.js,.ts,.json,.md,.css,.html" />
                         </label>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <textarea 
                        value={content}
                        onChange={e => { setContent(e.target.value); setShareUrl(""); }}
                        className="w-full h-full min-h-[500px] bg-transparent p-8 font-mono text-sm resize-none outline-none focus:border-primary/50 transition-all custom-scrollbar text-white/90"
                        placeholder="Paste your code or text here..."
                        spellCheck={false}
                      />
                    </div>
                 </div>
               )}

               {activeTab === "file" && (
                 <div className="glass-panel p-12 rounded-[3rem] border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[600px] space-y-8">
                    <div className="p-8 bg-primary/5 rounded-full border border-primary/20 relative group">
                       <File className="w-16 h-16 text-primary group-hover:scale-110 transition-transform" />
                       <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10" />
                    </div>
                    
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">Upload Single File</h3>
                       <p className="text-sm text-muted-foreground">Direct sharing via 0x0.st (max 512MB)</p>
                    </div>

                    <div className="w-full max-w-md space-y-6">
                       <label className={cn(
                         "w-full flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
                         selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-primary/50 bg-black/40"
                       )}>
                          {selectedFile ? (
                            <div className="text-center space-y-2">
                               <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                               <p className="text-xs font-bold text-emerald-400 uppercase truncate max-w-[250px]">{selectedFile.name}</p>
                               <p className="text-[10px] text-muted-foreground font-mono">{formatSize(selectedFile.size)}</p>
                            </div>
                          ) : (
                            <div className="text-center space-y-2">
                               <Plus className="w-8 h-8 text-white/20 mx-auto" />
                               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Drop file or Click to browse</p>
                            </div>
                          )}
                          <input type="file" className="hidden" onChange={e => { setSelectedFile(e.target.files?.[0] || null); setShareUrl(""); }} />
                       </label>

                       {isUploading && (
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                               <span>Uploading...</span>
                               <span className="text-primary">{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                         </div>
                       )}

                       <button 
                         onClick={handleFileUpload}
                         disabled={!selectedFile || isUploading}
                         className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                       >
                         {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Upload File"}
                       </button>
                    </div>
                 </div>
               )}

               {activeTab === "folder" && (
                 <div className="glass-panel p-12 rounded-[3rem] border border-white/5 bg-black/20 flex flex-col items-center justify-center min-h-[600px] space-y-8">
                    <div className="p-8 bg-amber-500/5 rounded-full border border-amber-500/20 relative group">
                       <FolderArchive className="w-16 h-16 text-amber-500 group-hover:scale-110 transition-transform" />
                       <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full -z-10" />
                    </div>
                    
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter">Upload Folder</h3>
                       <p className="text-sm text-muted-foreground">Folder will be zipped and uploaded to 0x0.st</p>
                    </div>

                    <div className="w-full max-w-md space-y-6">
                       <label className={cn(
                         "w-full flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
                         selectedFolderFiles ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-primary/50 bg-black/40"
                       )}>
                          {selectedFolderFiles ? (
                            <div className="text-center space-y-2">
                               <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                               <p className="text-xs font-bold text-emerald-400 uppercase truncate max-w-[250px]">
                                 {selectedFolderFiles[0]?.webkitRelativePath.split('/')[0] || "Folder"}
                               </p>
                               <p className="text-[10px] text-muted-foreground font-mono">{selectedFolderFiles.length} files detected</p>
                            </div>
                          ) : (
                            <div className="text-center space-y-2">
                               <Plus className="w-8 h-8 text-white/20 mx-auto" />
                               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Folder</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            multiple 
                            // @ts-ignore
                            webkitdirectory="" 
                            directory="" 
                            onChange={e => { setSelectedFolderFiles(e.target.files); setShareUrl(""); }} 
                          />
                       </label>

                       {isUploading && (
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                               <span>{uploadProgress < 100 ? "Uploading ZIP..." : "Finalizing..."}</span>
                               <span className="text-primary">{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                         </div>
                       )}

                       <button 
                         onClick={handleFolderUpload}
                         disabled={!selectedFolderFiles || isUploading}
                         className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                       >
                         {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Zip & Upload"}
                       </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Side Settings / Output */}
            <div className="lg:col-span-4 space-y-6">
               
               {activeTab === "text" && (
                  <div className="glass-panel p-1 rounded-2xl border border-white/5 bg-black/40 flex relative">
                     <button 
                       onClick={() => { setVisibility("private"); setShareUrl(""); }}
                       className={cn(
                         "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest relative z-10",
                         visibility === "private" ? "text-white" : "text-muted-foreground hover:text-white"
                       )}
                     >
                       <LockKeyhole className="w-3.5 h-3.5" /> Private
                       {visibility === "private" && (
                         <motion.div 
                           layoutId="visibility-pill"
                           className="absolute inset-0 bg-primary rounded-xl shadow-lg -z-10"
                           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                         />
                       )}
                     </button>
                     <button 
                       onClick={() => { setVisibility("public"); setShareUrl(""); }}
                       className={cn(
                         "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest relative z-10",
                         visibility === "public" ? "text-white" : "text-muted-foreground hover:text-white"
                       )}
                     >
                       <Globe className="w-3.5 h-3.5" /> Public
                       {visibility === "public" && (
                         <motion.div 
                           layoutId="visibility-pill"
                           className="absolute inset-0 bg-primary rounded-xl shadow-lg -z-10"
                           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                         />
                       )}
                     </button>
                  </div>
                )}

                {activeTab === "text" && (
                  <div className="glass-panel p-1 rounded-2xl border border-white/5 bg-black/40 flex relative">
                     <button 
                       onClick={() => setSharePermission("view")}
                       className={cn(
                         "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors text-[9px] font-bold uppercase tracking-widest relative z-10",
                         sharePermission === "view" ? "text-emerald-400" : "text-muted-foreground hover:text-white"
                       )}
                     >
                       <Eye className="w-3 h-3" /> View Only
                       {sharePermission === "view" && (
                         <motion.div 
                           layoutId="permission-pill"
                           className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-xl -z-10"
                           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                         />
                       )}
                     </button>
                     <button 
                       onClick={() => setSharePermission("edit")}
                       className={cn(
                         "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors text-[9px] font-bold uppercase tracking-widest relative z-10",
                         sharePermission === "edit" ? "text-amber-400" : "text-muted-foreground hover:text-white"
                       )}
                     >
                       <Pencil className="w-3 h-3" /> Editable
                       {sharePermission === "edit" && (
                         <motion.div 
                           layoutId="permission-pill"
                           className="absolute inset-0 bg-amber-500/20 border border-amber-500/30 rounded-xl -z-10"
                           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                         />
                       )}
                     </button>
                  </div>
                )}

               <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-black/20 space-y-8">
                  {activeTab === "text" && (
                    visibility === "private" ? (
                      <div className="space-y-6">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Encryption</label>
                            <div className="relative">
                              <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Set Password" 
                                value={password}
                                onChange={e => { setPassword(e.target.value); setShareUrl(""); }}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all font-mono"
                              />
                              <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Link Expiry</label>
                         <div className="grid grid-cols-2 gap-2">
                            {EXPIRIES.map(e => (
                              <button 
                                key={e.id}
                                onClick={() => { setExpiry(e.id); setShareUrl(""); }}
                                className={cn(
                                  "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                                  expiry === e.id ? "bg-primary border-primary text-white" : "border-white/10 text-muted-foreground hover:bg-white/5"
                                )}
                              >
                                {e.label}
                              </button>
                            ))}
                         </div>
                      </div>
                    )
                  )}

                  {activeTab === "text" && (
                    <button 
                      onClick={generateShareLink}
                      disabled={!content.trim() || isGenerating}
                      className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 disabled:opacity-30"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Generate Link
                    </button>
                  )}

                  {activeTab !== "text" && (
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-3 animate-in fade-in slide-in-from-bottom-4">
                       <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                       <p className="text-[10px] text-amber-500/60 leading-relaxed font-bold uppercase tracking-tight">
                         Files are publicly accessible to anyone with the link via 0x0.st. Avoid sensitive data.
                       </p>
                    </div>
                  )}
               </div>

               {shareUrl && (
                 <div className="glass-panel p-8 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/[0.02] space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center text-center space-y-4">
                       <div className="p-4 bg-emerald-500/10 rounded-full relative">
                          <ShieldCheck className="w-8 h-8 text-emerald-400 relative z-10" />
                          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-xl font-black font-syne text-white uppercase tracking-tighter">Sharing Ready!</h4>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                             {activeTab === "text" && visibility === "public" ? "Public dpaste Link" : activeTab === "text" ? "Private URL Hash" : "Direct 0x0.st Link"}
                          </p>
                       </div>
                    </div>

                    <div className="flex justify-center p-8 bg-black/60 rounded-[2.5rem] border border-white/5 relative group overflow-hidden">
                       <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                       {qrUrl ? (
                         <img src={qrUrl} alt="QR Code" className="w-48 h-48 relative z-10 brightness-110 contrast-125" />
                       ) : (
                         <QrCodeIcon className="w-12 h-12 text-white/5 animate-pulse" />
                       )}
                    </div>

                    <div className="space-y-4">
                       <div className="bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-emerald-300/80 break-all text-center leading-relaxed">
                          {shareUrl}
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => copy(shareUrl, "Copied!")}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2"
                          >
                            {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                          </button>
                          <a 
                            href={shareUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 py-4 bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open
                          </a>
                       </div>
                    </div>
                 </div>
               )}
            </div>

          </div>
        )}
        </>
        )}

      </div>
    </ToolLayout>
  )
}
