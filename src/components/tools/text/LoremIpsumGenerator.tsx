import React, { useState, useEffect } from "react"
import { AlignLeft, Copy, CheckCircle, RefreshCcw, Type, Quote, Terminal, Coffee } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { PillToggle } from "@/components/shared/PillToggle"
import { cn } from "@/lib/utils"

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
    
    const rWord = () => dict[Math.floor(Math.random() * dict.length)]
    const rSentence = () => {
      const len = Math.floor(Math.random() * 8) + 5
      const words = Array.from({length: len}, rWord)
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
      return words.join(" ") + "."
    }
    const rParagraph = () => {
      const len = Math.floor(Math.random() * 4) + 3
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

    if (type === "classic" && (unit === "paragraphs" || unit === "sentences")) {
      if (!result.toLowerCase().startsWith("lorem")) {
        result = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + result
      }
    }

    setOutput(result)
  }

  useEffect(() => {
    generate()
  }, [type, unit, count])

  return (
    <ToolLayout 
      title="Lorem Ipsum Studio" 
      description="Generate high-fidelity placeholder text for architectural mockups." 
      icon={AlignLeft}
      centered={true}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8 px-4 sm:px-0 pb-12">
        <div className="flex justify-center">
           <PillToggle 
             activeId={type}
             onChange={(id) => setType(id as any)}
             options={[
               { id: "classic", label: "Classic", icon: Type },
               { id: "tech", label: "Tech", icon: Terminal },
               { id: "hipster", label: "Hipster", icon: Coffee },
             ]}
           />
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] bg-black/20 border border-white/5 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex-1 md:flex-none flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-inner">
                   <input 
                     type="number"
                     min="1"
                     max="100"
                     value={count}
                     onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                     className="w-16 bg-transparent border-none outline-none font-mono text-center text-primary font-black text-xl"
                   />
                   <div className="w-px h-6 bg-white/10 mx-2" />
                   <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as any)}
                      className="bg-transparent border-none outline-none font-black text-[10px] uppercase tracking-widest text-muted-foreground pl-2 pr-6 appearance-none cursor-pointer hover:text-white transition-colors"
                   >
                     <option className="bg-[#0A0A0A]" value="paragraphs">Paragraphs</option>
                     <option className="bg-[#0A0A0A]" value="sentences">Sentences</option>
                     <option className="bg-[#0A0A0A]" value="words">Words</option>
                   </select>
                </div>
                
                <button 
                  onClick={generate}
                  className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all hover:scale-110 active:scale-95 group"
                  title="Regenerate"
                >
                  <RefreshCcw className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
                </button>
             </div>

             <button 
                onClick={() => copy(output)}
                className="w-full md:w-auto px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
             >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Payload"}
             </button>
          </div>

          <div className="relative group">
             <div className="absolute top-6 left-6 flex items-center gap-2 pointer-events-none z-10 opacity-30">
                <Quote className="w-10 h-10 text-primary" />
             </div>
             <textarea
               readOnly
               value={output}
               className="w-full h-[500px] bg-[#050505] border border-white/5 rounded-[2rem] p-12 pt-16 font-serif text-lg text-stone-300/80 leading-relaxed resize-none outline-none custom-scrollbar shadow-inner"
               spellCheck={false}
             />
             <div className="absolute bottom-6 right-8 flex items-center gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{output.split(' ').length} Words</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{output.length} Chars</span>
             </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
