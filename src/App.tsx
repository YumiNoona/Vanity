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

// Image Tools — lazy loaded
const ImageEffects = lazy(() => import(/* viteChunkName: "tool-image-effects" */ "./components/tools/image/ImageEffects").then(m => ({ default: m.ImageEffects })))
const RemoveBg = lazy(() => import(/* viteChunkName: "tool-remove-bg" */ "./components/tools/image/RemoveBg").then(m => ({ default: m.RemoveBg })))
const ImageCompressor = lazy(() => import(/* viteChunkName: "tool-image-compressor" */ "./components/tools/image/ImageCompressor").then(m => ({ default: m.ImageCompressor })))
const FormatConverter = lazy(() => import(/* viteChunkName: "tool-format-converter" */ "./components/tools/image/FormatConverter").then(m => ({ default: m.FormatConverter })))
const ImageCrop = lazy(() => import(/* viteChunkName: "tool-image-crop" */ "./components/tools/image/ImageCrop").then(m => ({ default: m.ImageCrop })))
const ImageWatermark = lazy(() => import(/* viteChunkName: "tool-image-watermark" */ "./components/tools/image/ImageWatermark").then(m => ({ default: m.ImageWatermark })))
const WatermarkRemover = lazy(() => import(/* viteChunkName: "tool-watermark-remover" */ "./components/tools/image/WatermarkRemover").then(m => ({ default: m.WatermarkRemover })))
const ImageToBase64 = lazy(() => import(/* viteChunkName: "tool-to-base64" */ "./components/tools/image/ImageToBase64").then(m => ({ default: m.ImageToBase64 })))
const ColorPalette = lazy(() => import(/* viteChunkName: "tool-palette" */ "./components/tools/image/ColorPalette").then(m => ({ default: m.ColorPalette })))
const SmartCensor = lazy(() => import(/* viteChunkName: "tool-censor" */ "./components/tools/image/SmartCensor").then(m => ({ default: m.SmartCensor })))
const ExifSanitizer = lazy(() => import(/* viteChunkName: "tool-exif" */ "./components/tools/image/ExifSanitizer").then(m => ({ default: m.ExifSanitizer })))
const QRGenerator = lazy(() => import(/* viteChunkName: "tool-qr" */ "./components/tools/image/QRGenerator").then(m => ({ default: m.QRGenerator })))
const BarcodeGenerator = lazy(() => import(/* viteChunkName: "tool-barcode" */ "./components/tools/image/BarcodeGenerator").then(m => ({ default: m.BarcodeGenerator })))
const MemeGenerator = lazy(() => import(/* viteChunkName: "tool-meme" */ "./components/tools/image/MemeGenerator").then(m => ({ default: m.MemeGenerator })))
const AiUpscaler = lazy(() => import(/* viteChunkName: "tool-upscale" */ "./components/tools/image/AiUpscaler").then(m => ({ default: m.AiUpscaler })))
const OcrExtractor = lazy(() => import(/* viteChunkName: "tool-ocr" */ "./components/tools/image/OcrExtractor").then(m => ({ default: m.OcrExtractor })))

// PDF Tools — lazy loaded
const MergePdf = lazy(() => import(/* viteChunkName: "tool-merge-pdf" */ "./components/tools/pdf/MergePdf").then(m => ({ default: m.MergePdf })))
const SplitPdf = lazy(() => import(/* viteChunkName: "tool-split-pdf" */ "./components/tools/pdf/SplitPdf").then(m => ({ default: m.SplitPdf })))
const PdfToImages = lazy(() => import(/* viteChunkName: "tool-pdf-to-images" */ "./components/tools/pdf/PdfToImages").then(m => ({ default: m.PdfToImages })))
const CompressPdf = lazy(() => import(/* viteChunkName: "tool-compress-pdf" */ "./components/tools/pdf/CompressPdf").then(m => ({ default: m.CompressPdf })))
const PdfPassword = lazy(() => import(/* viteChunkName: "tool-pdf-password" */ "./components/tools/pdf/PdfPassword").then(m => ({ default: m.PdfPassword })))
const ReorderPdf = lazy(() => import(/* viteChunkName: "tool-reorder-pdf" */ "./components/tools/pdf/ReorderPdf").then(m => ({ default: m.ReorderPdf })))
const PdfWatermark = lazy(() => import(/* viteChunkName: "tool-pdf-watermark" */ "./components/tools/pdf/PdfWatermark").then(m => ({ default: m.PdfWatermark })))
const PdfEditor = lazy(() => import(/* viteChunkName: "tool-pdf-editor" */ "./components/tools/pdf/PdfEditor").then(m => ({ default: m.PdfEditor })))
const ImagesToPdf = lazy(() => import(/* viteChunkName: "tool-images-to-pdf" */ "./components/tools/pdf/ImagesToPdf").then(m => ({ default: m.ImagesToPdf })))

// Export loaders for prefetching popular tools
export const loaders = {
  "remove-bg": () => import(/* viteChunkName: "tool-remove-bg" */ "./components/tools/image/RemoveBg"),
  "image-compressor": () => import(/* viteChunkName: "tool-image-compressor" */ "./components/tools/image/ImageCompressor"),
  "ocr": () => import(/* viteChunkName: "tool-ocr" */ "./components/tools/image/OcrExtractor"),
  "merge-pdf": () => import(/* viteChunkName: "tool-merge-pdf" */ "./components/tools/pdf/MergePdf"),
  "images-to-pdf": () => import(/* viteChunkName: "tool-images-to-pdf" */ "./components/tools/pdf/ImagesToPdf"),
  "pdf-editor": () => import(/* viteChunkName: "tool-pdf-editor" */ "./components/tools/pdf/PdfEditor"),
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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            
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
            
            {/* Fallback */}
            <Route path="/tools/*" element={<div className="flex h-[50vh] items-center justify-center text-muted-foreground flex-col gap-4">
              <span className="text-2xl font-bold font-syne text-primary">In Development</span>
              <p className="text-sm">This specific tool is being tuned for maximum performance.</p>
            </div>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
