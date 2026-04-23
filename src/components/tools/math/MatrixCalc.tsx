import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Calculator, ArrowRightLeft, Plus, X, RotateCcw, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type Matrix = number[][]

export function MatrixCalc() {
  const [size, setSize] = useState(3)
  const [matrixA, setMatrixA] = useState<Matrix>(Array(5).fill(0).map(() => Array(5).fill(0)))
  const [matrixB, setMatrixB] = useState<Matrix>(Array(5).fill(0).map(() => Array(5).fill(0)))
  const [result, setResult] = useState<Matrix | number | null>(null)
  const [operation, setOperation] = useState<"add" | "multiply" | "det" | "transpose">("add")

  const updateMatrix = (m: "A" | "B", r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0
    if (m === "A") {
      const next = [...matrixA.map(row => [...row])]
      next[r][c] = num
      setMatrixA(next)
    } else {
      const next = [...matrixB.map(row => [...row])]
      next[r][c] = num
      setMatrixB(next)
    }
  }

  const calculate = () => {
    if (operation === "add") {
      const res = Array(size).fill(0).map((_, r) => 
        Array(size).fill(0).map((_, c) => matrixA[r][c] + matrixB[r][c])
      )
      setResult(res)
    } else if (operation === "multiply") {
      const res = Array(size).fill(0).map((_, r) => 
        Array(size).fill(0).map((_, c) => {
          let sum = 0
          for (let i = 0; i < size; i++) {
            sum += matrixA[r][i] * matrixB[i][c]
          }
          return sum
        })
      )
      setResult(res)
    } else if (operation === "transpose") {
      const res = Array(size).fill(0).map((_, r) => 
        Array(size).fill(0).map((_, c) => matrixA[c][r])
      )
      setResult(res)
    } else if (operation === "det") {
      setResult(getDeterminant(matrixA.map(r => r.slice(0, size)).slice(0, size)))
    }
  }

  const getDeterminant = (m: Matrix): number => {
    const n = m.length
    if (n === 1) return m[0][0]
    if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0]
    
    let det = 0
    for (let i = 0; i < n; i++) {
      const sub = m.slice(1).map(row => row.filter((_, j) => j !== i))
      det += Math.pow(-1, i) * m[0][i] * getDeterminant(sub)
    }
    return det
  }

  return (
    <ToolLayout
      title="Matrix Calculator"
      description="Perform linear algebra operations on matrices up to 5x5 locally in your browser."
      icon={Calculator}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-4 items-center justify-between glass-panel p-4 rounded-2xl border-white/5 bg-black/20">
           <div className="flex items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Matrix Size</label>
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                 {[2, 3, 4, 5].map(s => (
                   <button
                     key={s}
                     onClick={() => setSize(s)}
                     className={cn(
                       "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                       size === s ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                     )}
                   >{s}x{s}</button>
                 ))}
              </div>
           </div>
           
           <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {[
                { id: "add", icon: Plus, label: "Add" },
                { id: "multiply", icon: X, label: "Multiply" },
                { id: "det", icon: Calculator, label: "Det" },
                { id: "transpose", icon: RotateCcw, label: "Trans" },
              ].map(op => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    operation === op.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <op.icon className="w-3.5 h-3.5" /> {op.label}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Matrix A */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Matrix A
                    </label>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                       {Array(size).fill(0).map((_, r) => Array(size).fill(0).map((_, c) => (
                         <input 
                           key={`${r}-${c}`}
                           type="number"
                           value={matrixA[r][c] || ""}
                           onChange={e => updateMatrix("A", r, c, e.target.value)}
                           className="bg-white/5 border border-white/10 rounded-lg p-2 text-center font-mono text-xs focus:border-primary/50 outline-none"
                         />
                       )))}
                    </div>
                 </div>

                 {/* Matrix B (Only for Add/Multiply) */}
                 {(operation === "add" || operation === "multiply") && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Matrix B
                      </label>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                         {Array(size).fill(0).map((_, r) => Array(size).fill(0).map((_, c) => (
                           <input 
                             key={`${r}-${c}`}
                             type="number"
                             value={matrixB[r][c] || ""}
                             onChange={e => updateMatrix("B", r, c, e.target.value)}
                             className="bg-white/5 border border-white/10 rounded-lg p-2 text-center font-mono text-xs focus:border-accent/50 outline-none"
                           />
                         )))}
                      </div>
                   </div>
                 )}
              </div>

              <button 
                onClick={calculate}
                className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Calculator className="w-5 h-5" /> Calculate
              </button>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 h-full min-h-[300px] flex flex-col">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Result</label>
                 <div className="flex-1 flex items-center justify-center">
                    {result === null ? (
                      <p className="text-xs text-muted-foreground italic">Fill matrices and calculate...</p>
                    ) : typeof result === "number" ? (
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Determinant</p>
                         <p className="text-5xl font-black font-syne text-white">{result.toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 w-full" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                         {result.map((row, r) => row.map((val, c) => (
                           <div key={`${r}-${c}`} className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center font-mono text-sm font-bold text-primary">
                             {val.toLocaleString()}
                           </div>
                         )))}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4">
           <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
           <p className="text-[10px] text-muted-foreground leading-relaxed">
             This tool uses standard matrix algorithms for addition, multiplication, and transposition. Determinants are calculated using cofactor expansion (Laplace expansion), which is efficient for matrices up to 5x5.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
