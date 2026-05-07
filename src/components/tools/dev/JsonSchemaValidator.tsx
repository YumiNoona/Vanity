import React, { useState, useEffect } from "react"
import { CheckCircle2, XCircle, FileJson, AlertTriangle, ShieldCheck, Database, FileCode, RefreshCw, Plus, Trash2, ArrowRight } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function JsonSchemaValidator() {
  const [schemaStr, setSchemaStr] = useState("{\n  \"type\": \"object\",\n  \"properties\": {\n    \"name\": { \"type\": \"string\" },\n    \"age\": { \"type\": \"number\" }\n  },\n  \"required\": [\"name\", \"age\"]\n}")
  const [jsonStr, setJsonStr] = useState("{\n  \"name\": \"John Doe\",\n  \"age\": \"twenty\"\n}")
  const [errors, setErrors] = useState<any[] | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const validateAsync = async () => {
      if (!schemaStr.trim() || !jsonStr.trim()) {
        setIsValid(null)
        setErrors(null)
        setParseError(null)
        return
      }

      try {
        const schema = JSON.parse(schemaStr)
        const data = JSON.parse(jsonStr)

        const { default: Ajv } = await import("ajv")
        const ajv = new Ajv({ allErrors: true, verbose: true })
        const validate = ajv.compile(schema)
        const valid = validate(data)

        setIsValid(valid as boolean)
        setErrors(validate.errors || null)
        setParseError(null)
      } catch (e: any) {
        setParseError(e.message)
        setIsValid(null)
        setErrors(null)
      } finally {
        setIsInitializing(false)
      }
    }

    const timer = setTimeout(validateAsync, 300)
    return () => clearTimeout(timer)
  }, [schemaStr, jsonStr])

  const clearAll = () => {
    setSchemaStr("")
    setJsonStr("")
    toast.info("Workspace cleared")
  }

  const loadSample = () => {
    setSchemaStr(JSON.stringify({
      type: "object",
      properties: {
        id: { type: "integer" },
        user: { type: "string", minLength: 3 },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["id", "user"]
    }, null, 2))
    setJsonStr(JSON.stringify({
      id: 101,
      user: "jd",
      tags: ["admin", 123]
    }, null, 2))
    toast.success("Sample loaded")
  }

  return (
    <ToolLayout 
      title="JSON Schema Validator" 
      description="Industrial-grade validation against draft-7 specifications." 
      icon={ShieldCheck} 
      centered={true} 
      maxWidth="max-w-7xl"
    >
      <div className="space-y-6 px-4 sm:px-0 pb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex gap-2">
              <button onClick={loadSample} className="px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground rounded-lg hover:bg-white/10 transition-all">
                 Load Sample
              </button>
              <button onClick={clearAll} className="px-3 py-1.5 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground rounded-lg hover:bg-white/10 transition-all">
                 Clear
              </button>
           </div>

           <div>
              {parseError ? (
                 <div className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                   <AlertTriangle className="w-4 h-4" /> Syntax Error
                 </div>
              ) : isValid === true ? (
                 <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                   <CheckCircle2 className="w-4 h-4" /> Compliant
                 </div>
              ) : isValid === false ? (
                 <div className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                   <XCircle className="w-4 h-4" /> {errors?.length} Issues
                 </div>
              ) : null}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">JSON Schema</label>
            <textarea 
              value={schemaStr}
              onChange={e => setSchemaStr(e.target.value)}
              className="w-full h-[350px] bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[13px] resize-none outline-none focus:border-sky-500/30 transition-all text-sky-400/80 shadow-inner"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">JSON Data</label>
            <textarea 
              value={jsonStr}
              onChange={e => setJsonStr(e.target.value)}
              className={cn(
                "w-full h-[350px] bg-black/40 border rounded-2xl p-6 font-mono text-[13px] resize-none outline-none transition-all text-emerald-400/80 shadow-inner",
                isValid === false ? 'border-red-500/30' : isValid === true ? 'border-emerald-500/30' : 'border-white/5'
              )}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
           {parseError ? (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-4">
                 <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-red-300 font-mono leading-relaxed">{parseError}</p>
              </div>
           ) : errors && errors.length > 0 ? (
              <div className="bg-black/40 border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl">
                 <div className="px-4 py-2 bg-red-500/5 border-b border-red-500/10 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60">Violation Audit</span>
                    <span className="text-[8px] font-mono text-red-500/40 uppercase">Draft-7</span>
                 </div>
                 <div className="p-4 space-y-3">
                   {errors.map((err, i) => (
                     <div key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-[9px] font-black text-red-500/40 shrink-0">
                           {i + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center gap-2">
                              <code className="text-[9px] font-black text-red-400/80 bg-red-400/5 px-1.5 py-0.5 rounded uppercase">{err.instancePath || '/'}</code>
                              <span className="text-[8px] font-black text-white/20 uppercase">({err.keyword})</span>
                           </div>
                           <p className="text-xs text-white/90 font-medium">
                              {err.message}
                           </p>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
           ) : isValid === true ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-4">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                 <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest">JSON instance matches all schema constraints</p>
              </div>
           ) : null}
        </div>
      </div>
    </ToolLayout>
  )
}
