import React, { useState, useRef } from "react"
import { DropZone } from "@/components/shared/DropZone"
import { ArrowLeft, Mic, Download, RefreshCw, Zap, VideoOff, CheckCircle } from "lucide-react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"
import { useProcessingState } from "@/hooks/useProcessingState"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { getFFmpeg } from "@/lib/ffmpeg"
import { useObjectUrl } from "@/hooks/useObjectUrl"

export function VideoToMp3() {
  const [file, setFile] = useState<File | null>(null)
  const { isProcessing, progress, startProcessing, updateProgress, finishProcessing } = useProcessingState()
  const { url: resultUrl, setUrl: setResultUrl, clear: clearResultUrl } = useObjectUrl()

  const handleDrop = (files: File[]) => {
    if (files[0]) {
      setFile(files[0])
      clearResultUrl()
    }
  }

  const extractAudio = async () => {
    if (!file) return
    startProcessing()
    
    try {
      const ffmpeg = await getFFmpeg()
      
      ffmpeg.on("progress", ({ progress }) => {
        updateProgress(Math.round(progress * 100))
      })

      const inputName = `input.${file.name.split('.').pop()}`
      const outputName = "output.mp3"
      
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      
      // -vn = disable video. -ab = bitrate.
      await ffmpeg.exec(["-i", inputName, "-vn", "-ab", "192k", "-ar", "44100", "-y", outputName])

      const data = await ffmpeg.readFile(outputName)
      const blob = new Blob([new Uint8Array((data as Uint8Array).buffer) as any], { type: "audio/mp3" })
      setResultUrl(blob)
      toast.success("Audio extracted successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Extraction failed.")
    } finally {
      finishProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return
    const a = document.createElement("a")
    a.href = resultUrl
    a.download = `vanity-extracted-${file?.name.split('.')[0]}.mp3`
    a.click()
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in duration-500">
         <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-full mb-6 text-purple-500">
            <VideoOff className="w-8 h-8" />
         </div>
        <h1 className="text-4xl font-bold font-syne mb-1 text-white">Video to MP3</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Strip high-quality audio tracks from any video file instantly. 100% local.
        </p>
        <DropZone onDrop={handleDrop} accept={{ "video/*": [] }} label="Drop video to extract audio" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-20">
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
             <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-syne text-white">Audio Extractor</h1>
            <p className="text-muted-foreground text-sm">{file.name}</p>
          </div>
        </div>
        <button onClick={() => { setFile(null); clearResultUrl(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Change Video
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
           <div className="glass-panel p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
              {isProcessing ? (
                <div className="space-y-6 text-center z-10 w-full max-w-sm">
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   <div className="space-y-1">
                      <p className="text-lg font-bold text-white font-syne tracking-tight">Extracting... {progress}%</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">Processing Bitstream</p>
                   </div>
                </div>
              ) : resultUrl ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center z-10">
                    <div className="p-6 bg-purple-500/10 rounded-full inline-block text-purple-500 border border-purple-500/20 mb-4">
                       <CheckCircle className="w-16 h-16" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-4xl font-bold font-syne text-white">MP3 Ready</h2>
                       <p className="text-muted-foreground italic text-sm">Bitrate: 192kbps | Sampling: 44.1kHz</p>
                    </div>
                    <button 
                      onClick={handleDownload}
                      className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto"
                    >
                      <Download className="w-6 h-6" />
                      Download Extracted MP3
                    </button>
                 </div>
               ) : (
                <button 
                  onClick={extractAudio}
                  className="px-12 py-5 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-[1.05] transition-all flex items-center gap-4"
                >
                  <Zap className="w-6 h-6" />
                  Extract MP3 Track
                </button>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6 text-xs text-muted-foreground leading-relaxed">
            <div className="p-8 glass-panel rounded-3xl space-y-4 border-white/5 shadow-lg">
               <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Logic</h4>
               <p>This tool strips the video stream and re-encodes the audio using a high-quality 192kbps MP3 encoder. All logic runs in a secure, multi-threaded WASM sandbox.</p>
               <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 opacity-50">
                   <div className="w-2 h-2 rounded-full bg-purple-500" />
                   <span>No telemetry tracked</span>
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}
