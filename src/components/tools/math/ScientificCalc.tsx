import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Calculator, Delete, RotateCcw, X, Minus, Plus, Equal, Hash, Percent, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScientificCalc() {
  const [display, setDisplay] = useState("0")
  const [history, setHistory] = useState("")

  const append = (val: string) => {
    if (display === "0") setDisplay(val)
    else setDisplay(display + val)
  }

  const clear = () => {
    setDisplay("0")
    setHistory("")
  }

  const backspace = () => {
    if (display.length > 1) setDisplay(display.slice(0, -1))
    else setDisplay("0")
  }

  const solve = () => {
    try {
      // Use Function instead of eval for slightly better safety in this specific sandbox
      const result = new Function(`return ${display.replace(/×/g, "*").replace(/÷/g, "/")}`)()
      setHistory(display + " =")
      setDisplay(Number.isFinite(result) ? result.toString() : "Error")
    } catch (e) {
      setDisplay("Error")
    }
  }

  const func = (f: string) => {
    try {
      const val = parseFloat(display)
      let result = 0
      switch(f) {
        case "sin": result = Math.sin(val); break
        case "cos": result = Math.cos(val); break
        case "tan": result = Math.tan(val); break
        case "log": result = Math.log10(val); break
        case "ln": result = Math.log(val); break
        case "sqrt": result = Math.sqrt(val); break
        case "exp": result = Math.exp(val); break
        case "pow2": result = Math.pow(val, 2); break
      }
      setHistory(`${f}(${display}) =`)
      setDisplay(result.toString())
    } catch (e) {
      setDisplay("Error")
    }
  }

  const btn = (label: string, action: () => void, variant: "op" | "num" | "fn" | "eq" = "num") => (
    <button
      onClick={action}
      className={cn(
        "h-14 sm:h-16 rounded-2xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg",
        variant === "num" && "bg-white/5 border border-white/10 text-white hover:bg-white/10",
        variant === "op" && "bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30",
        variant === "fn" && "bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 text-xs uppercase tracking-widest",
        variant === "eq" && "bg-primary text-primary-foreground border-none"
      )}
    >
      {label}
    </button>
  )

  return (
    <ToolLayout
      title="Scientific Calculator"
      description="Advanced calculations including trigonometry, logarithms, and powers entirely in your browser."
      icon={Calculator}
      centered={true}
    >
      <div className="max-w-xl mx-auto space-y-6">
         <div className="glass-panel p-8 rounded-[40px] border border-white/5 bg-black/20 shadow-2xl space-y-8">
            {/* Screen */}
            <div className="bg-black/40 rounded-3xl p-6 text-right space-y-1 min-h-[120px] flex flex-col justify-end border border-white/5 overflow-hidden">
               <p className="text-xs font-mono text-muted-foreground animate-in fade-in slide-in-from-right-2">{history}</p>
               <p className="text-4xl sm:text-5xl font-mono font-black text-white truncate">{display}</p>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
               {/* Row 1: Functions */}
               {btn("sin", () => func("sin"), "fn")}
               {btn("cos", () => func("cos"), "fn")}
               {btn("tan", () => func("tan"), "fn")}
               {btn("sqrt", () => func("sqrt"), "fn")}

               {/* Row 2 */}
               {btn("log", () => func("log"), "fn")}
               {btn("ln", () => func("ln"), "fn")}
               {btn("x²", () => func("pow2"), "fn")}
               {btn("AC", clear, "op")}

               {/* Row 3 */}
               {btn("7", () => append("7"))}
               {btn("8", () => append("8"))}
               {btn("9", () => append("9"))}
               {btn("÷", () => append(" / "), "op")}

               {/* Row 4 */}
               {btn("4", () => append("4"))}
               {btn("5", () => append("5"))}
               {btn("6", () => append("6"))}
               {btn("×", () => append(" * "), "op")}

               {/* Row 5 */}
               {btn("1", () => append("1"))}
               {btn("2", () => append("2"))}
               {btn("3", () => append("3"))}
               {btn("-", () => append(" - "), "op")}

               {/* Row 6 */}
               {btn("0", () => append("0"))}
               {btn(".", () => append("."))}
               {btn("⌫", backspace, "op")}
               {btn("+", () => append(" + "), "op")}

               {/* Result */}
               <div className="col-span-4 mt-2">
                  <button 
                    onClick={solve}
                    className="w-full h-16 bg-primary text-primary-foreground font-black text-2xl rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    =
                  </button>
               </div>
            </div>
         </div>

         <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center gap-4 text-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary shrink-0" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
               Standard JS Math precision · 100% Client-Side
            </p>
         </div>
      </div>
    </ToolLayout>
  )
}
