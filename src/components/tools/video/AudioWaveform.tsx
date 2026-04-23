import React, { useState, useRef, useEffect } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Mic, Scissors, Download, Loader2, FastForward } from "lucide-react"
import { fetchFile } from "@ffmpeg/util"
import { toast } from "sonner"

import { getFFmpeg } from "@/lib/ffmpeg"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function AudioWaveform() {
  const [file, setFile] = useState<File | null>(null)
  const { url: audioUrl, setUrl: setAudioUrl, clear: clearAudioUrl } = useObjectUrl()
  
  const [isDecoding, setIsDecoding] = useState(false)
  const [isTrimming, setIsTrimming] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const jobIdRef = useRef(0)
  
  // Trimming State (0 to 1 range representing percentage)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(1)
  const { url: trimmedUrl, setUrl: setTrimmedUrl, clear: clearTrimmedUrl } = useObjectUrl()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const handleDrop = async (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      setAudioUrl(files[0])
      setTrimStart(0)
      setTrimEnd(1)
      clearTrimmedUrl()
      decodeAudio(files[0])
    }
  }

  // Non-blocking decode via OfflineAudioContext
  const decodeAudio = async (tgtFile: File) => {
    const jobId = ++jobIdRef.current
    setIsDecoding(true)
    try {
      const buffer = await tgtFile.arrayBuffer()
      
      // Close previous context if exists
      if (audioCtxRef.current) {
        await audioCtxRef.current.close()
      }

      if (jobId !== jobIdRef.current) return

      const ctx = new window.AudioContext()
      audioCtxRef.current = ctx
      
      const decoded = await ctx.decodeAudioData(buffer)
      
      if (jobId !== jobIdRef.current) {
        ctx.close()
        return
      }

      setAudioBuffer(decoded)
      drawWaveform(decoded)
    } catch (err) {
      if (jobId === jobIdRef.current) {
        toast.error("Failed to decode audio. The file might be corrupted or unsupported.")
      }
    } finally {
      if (jobId === jobIdRef.current) {
        setIsDecoding(false)
      }
    }
  }

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set logical canvas dimensions
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    
    const width = canvas.width
    const height = canvas.height
    
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "transparent"
    ctx.fillRect(0, 0, width, height)

    // Only process channel 0 for visual simplicity
    const data = buffer.getChannelData(0)
    const step = Math.ceil(data.length / width)
    const amp = height / 2

    ctx.strokeStyle = "#8b5cf6" // purple-500
    ctx.lineWidth = 1
    ctx.beginPath()

    for (let i = 0; i < width; i++) {
        let min = 1.0
        let max = -1.0
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j]
            if (datum < min) min = datum
            if (datum > max) max = datum
        }
        ctx.moveTo(i, (1 + min) * amp)
        ctx.lineTo(i, (1 + max) * amp)
    }
    
    ctx.stroke()
  }



  const handleTrim = async () => {
    if (!file || !audioBuffer) return
    
    setIsTrimming(true)
    const inputName = `input_${file.name.replace(/[^a-zA-Z0-9]/g, "")}`
    const outName = "out.wav"
    let ffmpeg: Awaited<ReturnType<typeof getFFmpeg>> | null = null
    try {
       ffmpeg = await getFFmpeg()
       
       const totalDuration = audioBuffer.duration
       const startTime = totalDuration * trimStart
       const endTime = totalDuration * trimEnd

       await ffmpeg.writeFile(inputName, await fetchFile(file))
       
       // Re-encode to WAV for reliability across input formats.
       await ffmpeg.exec([
         "-ss", startTime.toFixed(3),
         "-to", endTime.toFixed(3),
         "-i", inputName,
         "-acodec", "pcm_s16le",
         "-ar", "44100",
         "-ac", "2",
         outName
       ])

       const data = await ffmpeg.readFile(outName)
       const blob = new Blob([new Uint8Array((data as Uint8Array).buffer) as any], { type: "audio/wav" })
       setTrimmedUrl(blob)
       toast.success("Audio trimmed successfully!")
       
    } catch (err) {
       toast.error("Failed to trim audio track")
    } finally {
       if (ffmpeg) {
         await Promise.allSettled([
           ffmpeg.deleteFile(inputName),
           ffmpeg.deleteFile(outName)
         ])
       }
       setIsTrimming(false)
    }
  }

  const handleDragUpdate = (e: React.MouseEvent | React.TouchEvent, handle: 'start' | 'end') => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const pct = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1))

    if (handle === 'start') {
       if (pct < trimEnd - 0.05) setTrimStart(pct)
    } else {
       if (pct > trimStart + 0.05) setTrimEnd(pct)
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00.0"
    const ms = Math.floor((seconds % 1) * 10)
    const s = Math.floor(seconds) % 60
    const m = Math.floor(seconds / 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
  }

  // Handle Resize recalculations
  useEffect(() => {
    if (!audioBuffer) return
    const handleResize = () => drawWaveform(audioBuffer)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [audioBuffer])

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error)
      }
    }
  }, [])

  if (!file) {
    return (
       <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-6 text-purple-500">
            <Mic className="w-8 h-8" />
         </div>
         <h1 className="text-4xl font-bold font-syne mb-1 text-white">Audio Waveform Visualizer</h1>
         <p className="text-muted-foreground text-lg mb-8">
           Visually inspect tracks and precision-trim segments locally without uploading.
         </p>
         <DropZone onDrop={handleDrop} accept={{ "audio/*": [] }} label="Drop MP3/WAV/AAC file" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
             <FastForward className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Audio Workstation</h1>
            <p className="text-muted-foreground text-sm">Target: <span className="text-purple-400 font-mono">{file.name}</span></p>
          </div>
        </div>
        <button onClick={async () => {
          if (audioCtxRef.current) await audioCtxRef.current.close().catch(() => {});
          setFile(null); 
          clearAudioUrl();
          clearTrimmedUrl();
          setAudioBuffer(null);
        }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Load Different
        </button>
      </div>

      <div className="glass-panel p-8 rounded-3xl space-y-8 relative overflow-hidden shadow-2xl border-purple-500/10">
        
        {isDecoding && (
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Decoding Audio Context...</p>
           </div>
        )}

        {/* Visualizer Area */}
        <div 
           ref={containerRef}
           className="relative w-full h-[200px] bg-black/40 border border-white/10 rounded-2xl overflow-hidden touch-none"
        >
           <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full"
           />
           
           {/* Trim Overlays */}
           {!isDecoding && audioBuffer && (
             <>
               <div className="absolute top-0 bottom-0 left-0 bg-black/60 z-10 pointer-events-none border-r border-red-500/30" style={{ width: `${trimStart * 100}%` }} />
               <div className="absolute top-0 bottom-0 right-0 bg-black/60 z-10 pointer-events-none border-l border-red-500/30" style={{ width: `${(1 - trimEnd) * 100}%` }} />
               
               {/* Handles */}
               <div 
                  className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize flex items-center justify-center z-20 group"
                  style={{ left: `${trimStart * 100}%` }}
                  onMouseDown={(e) => {
                     const move = (ev: MouseEvent) => handleDragUpdate(ev as any, 'start')
                     const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up) }
                     document.addEventListener("mousemove", move); document.addEventListener("mouseup", up)
                  }}
                  onTouchStart={(e) => {
                     const move = (ev: TouchEvent) => handleDragUpdate(ev as any, 'start')
                     const up = () => { document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up) }
                     document.addEventListener("touchmove", move, {passive: false}); document.addEventListener("touchend", up)
                  }}
               >
                  <div className="w-[3px] h-[50%] bg-white group-hover:bg-purple-400 rounded-full transition-colors drop-shadow-[0_0_5px_rgba(0,0,0,1)]" />
               </div>

               <div 
                  className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize flex items-center justify-center z-20 group"
                  style={{ left: `${trimEnd * 100}%` }}
                  onMouseDown={(e) => {
                     const move = (ev: MouseEvent) => handleDragUpdate(ev as any, 'end')
                     const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up) }
                     document.addEventListener("mousemove", move); document.addEventListener("mouseup", up)
                  }}
                  onTouchStart={(e) => {
                     const move = (ev: TouchEvent) => handleDragUpdate(ev as any, 'end')
                     const up = () => { document.removeEventListener("touchmove", move); document.removeEventListener("touchend", up) }
                     document.addEventListener("touchmove", move, {passive: false}); document.addEventListener("touchend", up)
                  }}
               >
                  <div className="w-[3px] h-[50%] bg-white group-hover:bg-purple-400 rounded-full transition-colors drop-shadow-[0_0_5px_rgba(0,0,0,1)]" />
               </div>
             </>
           )}
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
           <div className="text-center p-4 bg-black/20 rounded-xl">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Length</div>
             <div className="font-mono text-xl">{audioBuffer ? formatTime(audioBuffer.duration) : "--:--.-"}</div>
           </div>
           
           <div className="text-center p-4 bg-purple-500/10 rounded-xl relative border border-purple-500/20">
             <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Current Trim</div>
             <div className="font-mono text-xl text-white">
                {audioBuffer ? formatTime(audioBuffer.duration * trimStart) : "--:--"}
                <span className="text-purple-400 px-1">-</span> 
                {audioBuffer ? formatTime(audioBuffer.duration * trimEnd) : "--:--"}
             </div>
           </div>

           <div className="flex flex-col items-stretch justify-center">
              {!trimmedUrl ? (
                 <button 
                   onClick={handleTrim} 
                   disabled={isTrimming || !audioBuffer}
                   className="flex-1 py-2 bg-white/10 hover:bg-white/20 hover:text-white rounded-lg flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                 >
                   {isTrimming ? <><Loader2 className="w-5 h-5 animate-spin" /> Trimming...</> : <><Scissors className="w-5 h-5" /> Trim Segment</>}
                 </button>
              ) : (
                 <a 
                   href={trimmedUrl}
                   download={`vanity-trim-${file.name}`}
                   className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                 >
                   <Download className="w-5 h-5" /> Download Trim
                 </a>
              )}
           </div>
        </div>

        {audioUrl && !trimmedUrl && (
           <div className="w-full">
              <audio controls src={audioUrl} className="w-full h-10 custom-audio-player" />
           </div>
        )}
      </div>
    </div>
  )
}
