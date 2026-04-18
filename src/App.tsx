import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Home } from "./pages/Home"

// Image Tools
import { ImageEffects } from "./components/tools/image/ImageEffects"
import { RemoveBg } from "./components/tools/image/RemoveBg"
import { ImageCompressor } from "./components/tools/image/ImageCompressor"
import { FormatConverter } from "./components/tools/image/FormatConverter"
import { ImageCrop } from "./components/tools/image/ImageCrop"
import { ImageWatermark } from "./components/tools/image/ImageWatermark"
import { WatermarkRemover } from "./components/tools/image/WatermarkRemover"

// PDF Tools
import { MergePdf } from "./components/tools/pdf/MergePdf"
import { SplitPdf } from "./components/tools/pdf/SplitPdf"
import { PdfToImages } from "./components/tools/pdf/PdfToImages"
import { CompressPdf } from "./components/tools/pdf/CompressPdf"
import { PdfPassword } from "./components/tools/pdf/PdfPassword"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          
          {/* Image Tools */}
          <Route path="/tools/image/effects" element={<ImageEffects />} />
          <Route path="/tools/image/remove-bg" element={<RemoveBg />} />
          <Route path="/tools/image/compress" element={<ImageCompressor />} />
          <Route path="/tools/image/convert" element={<FormatConverter />} />
          <Route path="/tools/image/crop" element={<ImageCrop />} />
          <Route path="/tools/image/watermark" element={<ImageWatermark />} />
          <Route path="/tools/image/remove-watermark" element={<WatermarkRemover />} />
          
          {/* PDF Tools */}
          <Route path="/tools/pdf/merge" element={<MergePdf />} />
          <Route path="/tools/pdf/split" element={<SplitPdf />} />
          <Route path="/tools/pdf/compress" element={<CompressPdf />} />
          <Route path="/tools/pdf/password" element={<PdfPassword />} />
          <Route path="/tools/pdf/to-images" element={<PdfToImages />} />
          
          {/* Fallback */}
          <Route path="/tools/*" element={<div className="flex h-[50vh] items-center justify-center text-muted-foreground flex-col gap-4">
            <span className="text-2xl font-bold font-syne text-primary">In Development</span>
            <p className="text-sm">This specific tool is being tuned for maximum performance.</p>
          </div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
