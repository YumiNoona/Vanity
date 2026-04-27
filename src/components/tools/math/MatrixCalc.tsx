import React, { useState } from "react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { Calculator, ArrowRightLeft, Plus, X, RotateCcw, Info } from "lucide-react"
import { PillToggle } from "@/components/shared/PillToggle"
import { cn } from "@/lib/utils"

type Matrix = number[][]

export function MatrixCalc() {
  const [size, setSize] = useState(3)
  const [matrixA, setMatrixA] = useState<Matrix>(Array(5).fill(0).map(() => Array(5).fill(0)))
  const [matrixB, setMatrixB] = useState<Matrix>(Array(5).fill(0).map(() => Array(5).fill(0)))
  const [result, setResult] = useState<Matrix | number | null>(null)
  const [operation, setOperation] = useState<"add" | "multiply" | "det" | "transpose">("add")

  const reset = () => {
    setMatrixA(Array(5).fill(0).map(() => Array(5).fill(0)))
    setMatrixB(Array(5).fill(0).map(() => Array(5).fill(0)))
    setResult(null)
  }

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
      centered={true}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-8 items-center justify-center glass-panel p-4 rounded-2xl border-white/5 bg-black/20">
          <PillToggle
            activeId={size.toString()}
            onChange={(id) => setSize(parseInt(id))}
            options={[
              { id: "2", label: "2x2" },
              { id: "3", label: "3x3" },
              { id: "4", label: "4x4" },
              { id: "5", label: "5x5" },
            ]}
          />
          
          <div className="w-px h-8 bg-white/10 hidden md:block" />

          <PillToggle
            activeId={operation}
            onChange={(id) => setOperation(id as any)}
            options={[
              { id: "add", icon: Plus, label: "Add" },
              { id: "multiply", icon: X, label: "Multiply" },
              { id: "det", icon: Calculator, label: "Det" },
              { id: "transpose", icon: RotateCcw, label: "Trans" },
            ]}
          />
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
                           className="bg-white/5 border border-white/10 rounded-xl p-3 text-center font-mono text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:opacity-20"
                           placeholder="0"
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
                            className="bg-white/5 border border-white/10 rounded-xl p-3 text-center font-mono text-sm focus:border-accent/50 focus:bg-white/10 outline-none transition-all placeholder:opacity-20"
                            placeholder="0"
                          />
                         )))}
                      </div>
                   </div>
                 )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={calculate}
                  className="flex-1 h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Calculator className="w-5 h-5" /> Calculate
                </button>
                <button 
                  onClick={reset}
                  className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
                  title="Reset Matrices"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/20 h-full min-h-[300px] flex flex-col">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Result</label>
                 <div className="flex-1 flex items-center justify-center">
                    {result === null ? (
                      <p className="text-xs text-muted-foreground italic">Fill matrices and calculate...</p>
                    ) : typeof result === "number" ? (
                      <div className="text-center w-full px-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Determinant</p>
                         <p className="text-4xl md:text-5xl font-black text-white break-all">{result.toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="grid gap-1.5 md:gap-2 w-full" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
                         {result.map((row, r) => row.map((val, c) => (
                           <div 
                             key={`${r}-${c}`} 
                             className="bg-primary/10 border border-primary/20 rounded-lg md:rounded-xl p-1.5 md:p-2 text-center font-mono text-[10px] md:text-xs font-bold text-primary overflow-hidden text-ellipsis whitespace-nowrap"
                             title={val.toLocaleString()}
                           >
                             {val.toLocaleString()}
                           </div>
                         )))}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
           <Info className="w-5 h-5 text-primary shrink-0" />
           <p className="text-sm text-muted-foreground leading-relaxed">
             This tool uses standard matrix algorithms for addition, multiplication, and transposition. Determinants are calculated using cofactor expansion (Laplace expansion), which is efficient for matrices up to 5x5.
           </p>
        </div>
      </div>
    </ToolLayout>
  )
}
