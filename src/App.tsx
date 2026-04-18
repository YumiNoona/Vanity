import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Loader2 } from "lucide-react"

// Prefetch concurrency guard
let isPrefetching = false
export const preloadTool = async (loader: () => Promise<any>) => {
  if (isPrefetching) return
  isPrefetching = true
  try {
    await loader()
  } catch (e) {
    console.debug("Prefetch failed or cancelled", e)
  } finally {
    isPrefetching = false
  }
}

// Only Home loads eagerly — everything else is lazy with chunk names
const Home = lazy(() => import(/* viteChunkName: "home" */ "./pages/Home").then(m => ({ default: m.Home })))
const PrivacyPolicy = lazy(() => import(/* viteChunkName: "legal" */ "./pages/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })))

// AI Tools
const ScreenshotToCode = lazy(() => import("./components/tools/ai/ScreenshotToCode").then(m => ({ default: m.ScreenshotToCode })))
const AiAltTextWriter = lazy(() => import("./components/tools/ai/AiAltTextWriter").then(m => ({ default: m.AiAltTextWriter })))
const PdfSummariser = lazy(() => import("./components/tools/ai/PdfSummariser").then(m => ({ default: m.PdfSummariser })))
const BgReplacer = lazy(() => import("./components/tools/ai/BgReplacer").then(m => ({ default: m.BgReplacer })))

// Image Tools
const ImageEffects = lazy(() => import("./components/tools/image/ImageEffects").then(m => ({ default: m.ImageEffects })))
const RemoveBg = lazy(() => import("./components/tools/image/RemoveBg").then(m => ({ default: m.RemoveBg })))
const ImageCompressor = lazy(() => import("./components/tools/image/ImageCompressor").then(m => ({ default: m.ImageCompressor })))
const FormatConverter = lazy(() => import("./components/tools/image/FormatConverter").then(m => ({ default: m.FormatConverter })))
const ImageCrop = lazy(() => import("./components/tools/image/ImageCrop").then(m => ({ default: m.ImageCrop })))
const ImageWatermark = lazy(() => import("./components/tools/image/ImageWatermark").then(m => ({ default: m.ImageWatermark })))
const WatermarkRemover = lazy(() => import("./components/tools/image/WatermarkRemover").then(m => ({ default: m.WatermarkRemover })))
const ImageToBase64 = lazy(() => import("./components/tools/image/ImageToBase64").then(m => ({ default: m.ImageToBase64 })))
const ColorPalette = lazy(() => import("./components/tools/image/ColorPalette").then(m => ({ default: m.ColorPalette })))
const SmartCensor = lazy(() => import("./components/tools/image/SmartCensor").then(m => ({ default: m.SmartCensor })))
const ExifSanitizer = lazy(() => import("./components/tools/image/ExifSanitizer").then(m => ({ default: m.ExifSanitizer })))
const QRGenerator = lazy(() => import("./components/tools/image/QRGenerator").then(m => ({ default: m.QRGenerator })))
const BarcodeGenerator = lazy(() => import("./components/tools/image/BarcodeGenerator").then(m => ({ default: m.BarcodeGenerator })))
const MemeGenerator = lazy(() => import("./components/tools/image/MemeGenerator").then(m => ({ default: m.MemeGenerator })))
const AiUpscaler = lazy(() => import("./components/tools/image/AiUpscaler").then(m => ({ default: m.AiUpscaler })))
const OcrExtractor = lazy(() => import("./components/tools/image/OcrExtractor").then(m => ({ default: m.OcrExtractor })))
const SvgToRaster = lazy(() => import("./components/tools/image/SvgToRaster").then(m => ({ default: m.SvgToRaster })))
const SocialResizer = lazy(() => import("./components/tools/image/SocialResizer").then(m => ({ default: m.SocialResizer })))
const ImageToSketch = lazy(() => import("./components/tools/image/ImageToSketch").then(m => ({ default: m.ImageToSketch })))
const NoiseGrain = lazy(() => import("./components/tools/image/NoiseGrain").then(m => ({ default: m.NoiseGrain })))
const PixelArt = lazy(() => import("./components/tools/image/PixelArt").then(m => ({ default: m.PixelArt })))
const Duotone = lazy(() => import("./components/tools/image/Duotone").then(m => ({ default: m.Duotone })))
const AsciiArt = lazy(() => import("./components/tools/image/AsciiArt").then(m => ({ default: m.AsciiArt })))
const BeforeAfterSlider = lazy(() => import("./components/tools/image/BeforeAfterSlider").then(m => ({ default: m.BeforeAfterSlider })))
const GifMaker = lazy(() => import("./components/tools/image/GifMaker").then(m => ({ default: m.GifMaker })))
const SpriteSlicer = lazy(() => import("./components/tools/image/SpriteSlicer").then(m => ({ default: m.SpriteSlicer })))

// PDF Tools
const MergePdf = lazy(() => import("./components/tools/pdf/MergePdf").then(m => ({ default: m.MergePdf })))
const SplitPdf = lazy(() => import("./components/tools/pdf/SplitPdf").then(m => ({ default: m.SplitPdf })))
const PdfToImages = lazy(() => import("./components/tools/pdf/PdfToImages").then(m => ({ default: m.PdfToImages })))
const CompressPdf = lazy(() => import("./components/tools/pdf/CompressPdf").then(m => ({ default: m.CompressPdf })))
const PdfPassword = lazy(() => import("./components/tools/pdf/PdfPassword").then(m => ({ default: m.PdfPassword })))
const ReorderPdf = lazy(() => import("./components/tools/pdf/ReorderPdf").then(m => ({ default: m.ReorderPdf })))
const PdfWatermark = lazy(() => import("./components/tools/pdf/PdfWatermark").then(m => ({ default: m.PdfWatermark })))
const PdfEditor = lazy(() => import("./components/tools/pdf/PdfEditor").then(m => ({ default: m.PdfEditor })))
const ImagesToPdf = lazy(() => import("./components/tools/pdf/ImagesToPdf").then(m => ({ default: m.ImagesToPdf })))
const PdfToText = lazy(() => import("./components/tools/pdf/PdfToText").then(m => ({ default: m.PdfToText })))
const PdfToWord = lazy(() => import("./components/tools/pdf/PdfToWord").then(m => ({ default: m.PdfToWord })))
const PdfRotate = lazy(() => import("./components/tools/pdf/PdfRotate").then(m => ({ default: m.PdfRotate })))
const PdfFlatten = lazy(() => import("./components/tools/pdf/PdfFlatten").then(m => ({ default: m.PdfFlatten })))
const PdfCrop = lazy(() => import("./components/tools/pdf/PdfCrop").then(m => ({ default: m.PdfCrop })))
const PdfNup = lazy(() => import("./components/tools/pdf/PdfNup").then(m => ({ default: m.PdfNup })))
const RemoveBlankPages = lazy(() => import("./components/tools/pdf/RemoveBlankPages").then(m => ({ default: m.RemoveBlankPages })))

// Developer Tools
const JsonFormatter = lazy(() => import("./components/tools/dev/JsonFormatter").then(m => ({ default: m.JsonFormatter })))
const ColorPicker = lazy(() => import("./components/tools/dev/ColorPicker").then(m => ({ default: m.ColorPicker })))
const CssGradient = lazy(() => import("./components/tools/dev/CssGradient").then(m => ({ default: m.CssGradient })))
const Base64Tool = lazy(() => import("./components/tools/dev/Base64Tool").then(m => ({ default: m.Base64Tool })))
const FaviconGenerator = lazy(() => import("./components/tools/dev/FaviconGenerator").then(m => ({ default: m.FaviconGenerator })))
const UuidHashGenerator = lazy(() => import("./components/tools/dev/UuidHashGenerator").then(m => ({ default: m.UuidHashGenerator })))

// Video Tools
const VideoCompressor = lazy(() => import("./components/tools/video/VideoCompressor").then(m => ({ default: m.VideoCompressor })))
const AudioConverter = lazy(() => import("./components/tools/video/AudioConverter").then(m => ({ default: m.AudioConverter })))
const VideoToMp3 = lazy(() => import("./components/tools/video/VideoToMp3").then(m => ({ default: m.VideoToMp3 })))
const VideoToGif = lazy(() => import("./components/tools/video/VideoToGif").then(m => ({ default: m.VideoToGif })))
// const VideoToGif = lazy(() => import("./components/tools/video/VideoToGif").then(m => ({ default: m.VideoToGif })))

// Text Tools
const MarkdownPreview = lazy(() => import("./components/tools/text/MarkdownPreview").then(m => ({ default: m.MarkdownPreview })))
const TextAnalyser = lazy(() => import("./components/tools/text/TextAnalyser").then(m => ({ default: m.TextAnalyser })))
const TextDiff = lazy(() => import("./components/tools/text/TextDiff").then(m => ({ default: m.TextDiff })))
const CsvJsonConverter = lazy(() => import("./components/tools/text/CsvJsonConverter").then(m => ({ default: m.CsvJsonConverter })))

// Export loaders for prefetching popular tools
export const loaders = {
  "remove-bg": () => import("./components/tools/image/RemoveBg"),
  "upscale": () => import("./components/tools/image/AiUpscaler"),
  "merge-pdf": () => import("./components/tools/pdf/MergePdf"),
  "images-to-pdf": () => import("./components/tools/pdf/ImagesToPdf"),
}

function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">Loading tool...</span>
      </div>
    </div>
  )
}

function ToolFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
      <div className="mb-8 p-6 bg-primary/5 rounded-full border border-primary/10">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
      <h2 className="text-4xl font-extrabold font-syne mb-2">Refining Logic</h2>
      <p className="max-w-md text-muted-foreground">
        We're currently optimizing the WASM engine for this tool to ensure 100% local performance and privacy.
      </p>
      <div className="mt-8 flex gap-3">
        <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Local Inference</div>
        <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zero Cloud</div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            
            {/* AI Tools */}
            <Route path="/tools/ai/screenshot-to-code" element={<ScreenshotToCode />} />
            <Route path="/tools/ai/alt-text" element={<AiAltTextWriter />} />
            <Route path="/tools/ai/summarizer" element={<PdfSummariser />} />
            <Route path="/tools/ai/bg-replacer" element={<BgReplacer />} />

            {/* Image Tools */}
            <Route path="/tools/image/effects" element={<ImageEffects />} />
            <Route path="/tools/image/remove-bg" element={<RemoveBg />} />
            <Route path="/tools/image/compress" element={<ImageCompressor />} />
            <Route path="/tools/image/convert" element={<FormatConverter />} />
            <Route path="/tools/image/crop" element={<ImageCrop />} />
            <Route path="/tools/image/watermark" element={<ImageWatermark />} />
            <Route path="/tools/image/remove-watermark" element={<WatermarkRemover />} />
            <Route path="/tools/image/to-base64" element={<ImageToBase64 />} />
            <Route path="/tools/image/palette" element={<ColorPalette />} />
            <Route path="/tools/image/censor" element={<SmartCensor />} />
            <Route path="/tools/image/exif-sanitizer" element={<ExifSanitizer />} />
            <Route path="/tools/image/qr" element={<QRGenerator />} />
            <Route path="/tools/image/barcode" element={<BarcodeGenerator />} />
            <Route path="/tools/image/meme" element={<MemeGenerator />} />
            <Route path="/tools/image/upscale" element={<AiUpscaler />} />
            <Route path="/tools/image/ocr" element={<OcrExtractor />} />
            <Route path="/tools/image/svg-to-raster" element={<SvgToRaster />} />
            <Route path="/tools/sketch" element={<ImageToSketch />} />
            <Route path="/tools/image/social-resizer" element={<SocialResizer />} />
            <Route path="/tools/image/noise" element={<NoiseGrain />} />
            <Route path="/tools/image/pixel-art" element={<PixelArt />} />
            <Route path="/tools/image/duotone" element={<Duotone />} />
            <Route path="/tools/image/ascii" element={<AsciiArt />} />
            <Route path="/tools/image/slider" element={<BeforeAfterSlider />} />
            <Route path="/tools/image/gif-maker" element={<GifMaker />} />
            <Route path="/tools/image/sprite-slicer" element={<SpriteSlicer />} />

            {/* PDF Tools */}
            <Route path="/tools/pdf/merge" element={<MergePdf />} />
            <Route path="/tools/pdf/split" element={<SplitPdf />} />
            <Route path="/tools/pdf/compress" element={<CompressPdf />} />
            <Route path="/tools/pdf/password" element={<PdfPassword />} />
            <Route path="/tools/pdf/to-images" element={<PdfToImages />} />
            <Route path="/tools/pdf/images-to-pdf" element={<ImagesToPdf />} />
            <Route path="/tools/pdf/editor" element={<PdfEditor />} />
            <Route path="/tools/pdf/reorder" element={<ReorderPdf />} />
            <Route path="/tools/pdf/watermark" element={<PdfWatermark />} />
            <Route path="/tools/pdf/to-text" element={<PdfToText />} />
            <Route path="/tools/pdf/to-word" element={<PdfToWord />} />
            <Route path="/tools/pdf/rotate" element={<PdfRotate />} />
            <Route path="/tools/pdf/flatten" element={<PdfFlatten />} />
            <Route path="/tools/pdf/crop" element={<PdfCrop />} />
            <Route path="/tools/pdf/n-up" element={<PdfNup />} />
            <Route path="/tools/pdf/remove-blank" element={<RemoveBlankPages />} />
            
            {/* PDF Placeholders */}
            <Route path="/tools/pdf/compare" element={<ToolFallback />} />

            {/* Developer Tools */}
            <Route path="/tools/dev/json" element={<JsonFormatter />} />
            <Route path="/tools/dev/color" element={<ColorPicker />} />
            <Route path="/tools/dev/gradient" element={<CssGradient />} />
            <Route path="/tools/dev/base64" element={<Base64Tool />} />
            <Route path="/tools/dev/favicon" element={<FaviconGenerator />} />
            <Route path="/tools/dev/uuid-hash" element={<UuidHashGenerator />} />

            {/* Video Tools */}
            <Route path="/tools/video/compress" element={<VideoCompressor />} />
            <Route path="/tools/video/audio-convert" element={<AudioConverter />} />
            <Route path="/tools/video/video-to-mp3" element={<VideoToMp3 />} />
            <Route path="/tools/video/to-gif" element={<VideoToGif />} />
            <Route path="/tools/video/*" element={<ToolFallback />} />

            {/* Text Tools */}
            <Route path="/tools/text/md-preview" element={<MarkdownPreview />} />
            <Route path="/tools/text/analyser" element={<TextAnalyser />} />
            <Route path="/tools/text/diff" element={<TextDiff />} />
            <Route path="/tools/text/csv-json" element={<CsvJsonConverter />} />
            <Route path="/tools/text/md-to-pdf" element={<ToolFallback />} />
            
            {/* Fallback */}
            <Route path="*" element={<ToolFallback />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
