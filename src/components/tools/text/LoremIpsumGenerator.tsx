import React, { useState, useEffect } from "react"
import { AlignLeft, Copy, CheckCircle, RefreshCcw } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"

const DICTIONARIES = {
  classic: ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat"],
  tech: ["algorithm", "bandwidth", "node", "server", "cloud", "agile", "frontend", "api", "database", "latency", "protocol", "quantum", "neural", "framework", "deployment", "binary", "container", "docker", "kubernetes", "microservice", "scalable", "repository", "encryption", "pixel", "compile"],
  hipster: ["artisan", "kombucha", "sourdough", "vinyl", "succulent", "single-origin", "pour-over", "microbrew", "bespoke", "thrifty", "fixie", "mustache", "retro", "vegan", "gluten-free", "post-ironic", "synth", "cassette", "pabst", "flannel", "aesthetic", "organic", "typewriter", "polaroid", "farm-to-table"]
}

export function LoremIpsumGenerator() {
  const [type, setType] = useState<keyof typeof DICTIONARIES>("classic")
  const [unit, setUnit] = useState<"paragraphs" | "sentences" | "words">("paragraphs")
  const [count, setCount] = useState<number>(3)
  const [output, setOutput] = useState("")
  const { isCopied: copied, copy } = useCopyToClipboard()

  const generate = () => {
    let result = ""
    const dict = DICTIONARIES[type]
    
    // Quick random helpers
    const rWord = () => dict[Math.floor(Math.random() * dict.length)]
    const rSentence = () => {
      const len = Math.floor(Math.random() * 8) + 5 // 5 to 12 words
      const words = Array.from({length: len}, rWord)
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
      return words.join(" ") + "."
    }
    const rParagraph = () => {
      const len = Math.floor(Math.random() * 4) + 3 // 3 to 6 sentences
      return Array.from({length: len}, rSentence).join(" ")
    }

    if (unit === "paragraphs") {
      result = Array.from({length: Math.max(1, count)}, rParagraph).join("\n\n")
    } else if (unit === "sentences") {
      result = Array.from({length: Math.max(1, count)}, rSentence).join(" ")
    } else if (unit === "words") {
      const w = Array.from({length: Math.max(1, count)}, rWord)
      if (w.length > 0) w[0] = w[0].charAt(0).toUpperCase() + w[0].slice(1)
      result = w.join(" ") + (w.length > 0 ? "." : "")
    }

    // Force "Lorem ipsum" start if classic paragraphs/sentences are chosen and someone wants it
    if (type === "classic" && (unit === "paragraphs" || unit === "sentences")) {
      if (!result.toLowerCase().startsWith("lorem")) {
        result = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + result
      }
    }

    setOutput(result)
  }

  // Pre-gen on load or context shift
  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, unit, count])

  const handleCopy = () => {
    copy(output)
    }

  return (
    <ToolLayout 
      title="Lorem Ipsum Generator" 
      description="Generate customizable placeholder text instantly for your mockups." 
      icon={AlignLeft}
      centered={true}
      maxWidth="max-w-2xl"
    >
      <div className="glass-panel p-6 sm:p-8 rounded-2xl mx-4 sm:mx-0 space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/5 pb-6">
           <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 overflow-hidden w-full sm:w-auto">
             {(["classic", "tech", "hipster"] as const).map(t => (
               <button
                 key={t}
                 onClick={() => setType(t)}
                 className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold capitalize rounded-lg transition-colors ${type === t ? 'bg-stone-500/20 text-stone-400' : 'text-muted-foreground hover:text-white'}`}
               >
                 {t}
               </button>
             ))}
           </div>
           
           <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 overflow-hidden w-full sm:w-auto">
              <input 
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-16 bg-transparent border-none outline-none font-mono text-center text-white"
              />
              <select
                 value={unit}
                 onChange={(e) => setUnit(e.target.value as any)}
                 className="bg-transparent border-none outline-none font-bold text-sm text-stone-400 pl-2 pr-4 appear"
              >
                <option className="bg-background" value="paragraphs">Paragraphs</option>
                <option className="bg-background" value="sentences">Sentences</option>
                <option className="bg-background" value="words">Words</option>
              </select>
           </div>

           <button 
             onClick={generate}
             className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center"
             title="Regenerate"
           >
             <RefreshCcw className="w-5 h-5" />
           </button>
        </div>

        <div className="relative group">
           <button 
              onClick={handleCopy}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-white/10 backdrop-blur rounded-lg flex items-center gap-2 hover:bg-white/20 text-white font-bold text-xs"
           >
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Text"}
           </button>
           <textarea
             readOnly
             value={output}
             className="w-full h-[400px] bg-black/30 border border-white/5 rounded-xl p-6 text-sm text-stone-100/90 leading-relaxed resize-none outline-none custom-scrollbar"
             spellCheck={false}
           />
        </div>
      </div>
    </ToolLayout>
  )
}
