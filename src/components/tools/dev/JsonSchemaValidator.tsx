import React, { useState, useEffect } from "react"
import { CheckCircle2, XCircle, FileJson, AlertTriangle, ShieldCheck } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"


export function JsonSchemaValidator() {
  const [schemaStr, setSchemaStr] = useState("{\n  \"type\": \"object\",\n  \"properties\": {\n    \"name\": { \"type\": \"string\" },\n    \"age\": { \"type\": \"number\" }\n  },\n  \"required\": [\"name\", \"age\"]\n}")
  const [jsonStr, setJsonStr] = useState("{\n  \"name\": \"John Doe\",\n  \"age\": \"twenty\"\n}")
  const [errors, setErrors] = useState<any[] | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    if (!schemaStr.trim() || !jsonStr.trim()) {
      setIsValid(null)
      setErrors(null)
      setParseError(null)
      return
    }

    const validateAsync = async () => {
      try {
        const schema = JSON.parse(schemaStr)
        const data = JSON.parse(jsonStr)

        const { default: Ajv } = await import("ajv")
        const ajv = new Ajv({ allErrors: true })
        const validate = ajv.compile(schema)
        const valid = validate(data)

        setIsValid(valid as boolean)
        setErrors(validate.errors || null)
        setParseError(null)
      } catch (e: any) {
        setParseError(e.message)
        setIsValid(null)
        setErrors(null)
      }
    }
    validateAsync()
  }, [schemaStr, jsonStr])

  return (
    <ToolLayout title="JSON Schema Validator" description="Validate JSON data against draft-7 JSON Schema instantly." icon={ShieldCheck} centered={true} maxWidth="max-w-6xl">
      
      <div className="mb-6 flex items-center justify-center">
        {parseError ? (
           <div className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-3 text-sm font-bold">
             <AlertTriangle className="w-5 h-5" />
             Parse Error: {parseError}
           </div>
        ) : isValid === true ? (
           <div className="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-sm font-bold">
             <CheckCircle2 className="w-5 h-5" />
             JSON is valid against schema
           </div>
        ) : isValid === false ? (
           <div className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-3 text-sm font-bold">
             <XCircle className="w-5 h-5" />
             Validation Failed ({errors?.length} errors)
           </div>
        ) : (
           <div className="px-6 py-3 bg-white/5 text-muted-foreground border border-white/5 rounded-xl flex items-center gap-3 text-sm font-bold">
             <FileJson className="w-5 h-5" />
             Waiting for input...
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">JSON Schema (draft-7)</label>
          <textarea 
            value={schemaStr}
            onChange={e => setSchemaStr(e.target.value)}
            className="w-full h-[400px] bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none focus:border-primary/50 transition-all custom-scrollbar text-sky-300"
            spellCheck={false}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">JSON Data</label>
          <textarea 
            value={jsonStr}
            onChange={e => setJsonStr(e.target.value)}
            className={`w-full h-[400px] bg-black/40 border rounded-2xl p-6 font-mono text-sm resize-none outline-none transition-all custom-scrollbar text-emerald-300 ${isValid === false ? 'border-red-500/50' : isValid === true ? 'border-emerald-500/50' : 'border-white/10 focus:border-primary/50'}`}
            spellCheck={false}
          />
        </div>
      </div>

      {errors && errors.length > 0 && (
        <div className="mt-6 glass-panel rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
           <div className="p-4 bg-red-500/10 border-b border-red-500/10 flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-red-400" />
             <span className="text-xs font-black uppercase tracking-widest text-red-400">Validation Errors</span>
           </div>
           <div className="p-4">
             <ul className="space-y-2">
               {errors.map((err, i) => (
                 <li key={i} className="text-sm font-mono text-red-300 flex items-start gap-3">
                   <span className="text-red-500/50">{(i + 1).toString().padStart(2, '0')}</span>
                   <div>
                     <span className="font-bold text-red-400">{err.instancePath || 'root'}</span>: {err.message}
                   </div>
                 </li>
               ))}
             </ul>
           </div>
        </div>
      )}

    </ToolLayout>
  )
}
