import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Loader2 } from "lucide-react"

// Prefetch concurrency guard per loader
const activePrefetches = new Set<() => Promise<any>>()
export const preloadTool = async (loader: () => Promise<any>) => {
  if (activePrefetches.has(loader)) return
  activePrefetches.add(loader)
  try {
    await loader()
  } catch (e) {
    console.debug("Prefetch failed or cancelled", e)
  } finally {
    activePrefetches.delete(loader)
  }
}

// Only Home loads eagerly — everything else is lazy with chunk names
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })))
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })))

// AI Tools
const ScreenshotToCode = lazy(() => import("./components/tools/ai/ScreenshotToCode").then(m => ({ default: m.ScreenshotToCode })))
const ScreenshotToGameCode = lazy(() => import("./components/tools/ai/ScreenshotToGameCode").then(m => ({ default: m.ScreenshotToGameCode })))
const AltTextStudio = lazy(() => import("./components/tools/ai/AltTextStudio").then(m => ({ default: m.AltTextStudio })))
const PdfSummariser = lazy(() => import("./components/tools/ai/PdfSummariser").then(m => ({ default: m.PdfSummariser })))
const BgReplacer = lazy(() => import("./components/tools/ai/BgReplacer").then(m => ({ default: m.BgReplacer })))
const AiResumeReviewer = lazy(() => import("./components/tools/ai/AiResumeReviewer").then(m => ({ default: m.AiResumeReviewer })))
const FontDetectorVision = lazy(() => import("./components/tools/ai/FontDetectorVision").then(m => ({ default: m.FontDetectorVision })))
const ExplainUi = lazy(() => import("./components/tools/ai/ExplainUi").then(m => ({ default: m.ExplainUi })))
const ImageCaptionGenerator = lazy(() => import("./components/tools/ai/ImageCaptionGenerator").then(m => ({ default: m.ImageCaptionGenerator })))
const MockApiGenerator = lazy(() => import("./components/tools/ai/MockApiGenerator").then(m => ({ default: m.MockApiGenerator })))
const ApiKeysPage = lazy(() => import("./components/shared/ApiKeyManager").then(m => ({ default: m.ApiKeysPage })))

// Image Tools
const ImageEffects = lazy(() => import("./components/tools/image/ImageEffects").then(m => ({ default: m.ImageEffects })))
const RemoveBg = lazy(() => import("./components/tools/image/RemoveBg").then(m => ({ default: m.RemoveBg })))
const ImageCompressor = lazy(() => import("./components/tools/image/ImageCompressor").then(m => ({ default: m.ImageCompressor })))
const FormatConverter = lazy(() => import("./components/tools/image/FormatConverter").then(m => ({ default: m.FormatConverter })))
const ImageCrop = lazy(() => import("./components/tools/image/ImageCrop").then(m => ({ default: m.ImageCrop })))
const WatermarkStudio = lazy(() => import("./components/tools/image/WatermarkStudio").then(m => ({ default: m.WatermarkStudio })))
const ColorPalette = lazy(() => import("./components/tools/image/ColorPalette").then(m => ({ default: m.ColorPalette })))
const SmartCensor = lazy(() => import("./components/tools/image/SmartCensor").then(m => ({ default: m.SmartCensor })))
const ImagePrivacy = lazy(() => import("./components/tools/image/ImagePrivacy").then(m => ({ default: m.ImagePrivacy })))
const CodeGenerator = lazy(() => import("./components/tools/image/CodeGenerator").then(m => ({ default: m.CodeGenerator })))
const MemeGenerator = lazy(() => import("./components/tools/image/MemeGenerator").then(m => ({ default: m.MemeGenerator })))
const AiUpscaler = lazy(() => import("./components/tools/image/AiUpscaler").then(m => ({ default: m.AiUpscaler })))
const OcrExtractor = lazy(() => import("./components/tools/image/OcrExtractor").then(m => ({ default: m.OcrExtractor })))
const SocialResizer = lazy(() => import("./components/tools/image/SocialResizer").then(m => ({ default: m.SocialResizer })))
const ImageToSketch = lazy(() => import("./components/tools/image/ImageToSketch").then(m => ({ default: m.ImageToSketch })))
const NoiseGrain = lazy(() => import("./components/tools/image/NoiseGrain").then(m => ({ default: m.NoiseGrain })))
const PixelArt = lazy(() => import("./components/tools/image/PixelArt").then(m => ({ default: m.PixelArt })))
const AsciiArt = lazy(() => import("./components/tools/image/AsciiArt").then(m => ({ default: m.AsciiArt })))
const BeforeAfterSlider = lazy(() => import("./components/tools/image/BeforeAfterSlider").then(m => ({ default: m.BeforeAfterSlider })))
const GifMaker = lazy(() => import("./components/tools/image/GifMaker").then(m => ({ default: m.GifMaker })))
const SpriteSlicer = lazy(() => import("./components/tools/image/SpriteSlicer").then(m => ({ default: m.SpriteSlicer })))

const ColorBlindness = lazy(() => import("./components/tools/image/ColorBlindness").then(m => ({ default: m.ColorBlindness })))
const CollageMaker = lazy(() => import("./components/tools/image/CollageMaker").then(m => ({ default: m.CollageMaker })))

// Browser Tools
const DnsLookup = lazy(() => import("./components/tools/browser/DnsLookup").then(m => ({ default: m.DnsLookup })))
const IpLookup = lazy(() => import("./components/tools/browser/IpLookup").then(m => ({ default: m.IpLookup })))
const SslChecker = lazy(() => import("./components/tools/browser/SslChecker").then(m => ({ default: m.SslChecker })))
const UaParser = lazy(() => import("./components/tools/browser/UaParser").then(m => ({ default: m.UaParser })))
const MimeLookup = lazy(() => import("./components/tools/browser/MimeLookup").then(m => ({ default: m.MimeLookup })))
const SubnetCalculator = lazy(() => import("./components/tools/dev/SubnetCalculator").then(m => ({ default: m.SubnetCalculator })))
const LinkShortener = lazy(() => import("./components/tools/browser/LinkShortener").then(m => ({ default: m.LinkShortener })))

// Security Tools
const TotpGen = lazy(() => import("./components/tools/security/TotpGen").then(m => ({ default: m.TotpGen })))
const BcryptHasher = lazy(() => import("./components/tools/security/BcryptHasher").then(m => ({ default: m.BcryptHasher })))
const RsaGen = lazy(() => import("./components/tools/security/RsaGen").then(m => ({ default: m.RsaGen })))
const ChecksumVerify = lazy(() => import("./components/tools/security/ChecksumVerify").then(m => ({ default: m.ChecksumVerify })))

// Math Tools
const MatrixCalc = lazy(() => import("./components/tools/math/MatrixCalc").then(m => ({ default: m.MatrixCalc })))
const UnitStudio = lazy(() => import("./components/tools/math/UnitStudio").then(m => ({ default: m.UnitStudio })))
const ScientificCalc = lazy(() => import("./components/tools/math/ScientificCalc").then(m => ({ default: m.ScientificCalc })))
const PercentageCalc = lazy(() => import("./components/tools/math/PercentageCalc").then(m => ({ default: m.PercentageCalc })))
const AspectRatioCalc = lazy(() => import("./components/tools/math/AspectRatioCalc").then(m => ({ default: m.AspectRatioCalc })))

// Finance Tools
const FinanceStudio = lazy(() => import("./components/tools/finance/FinanceStudio").then(m => ({ default: m.FinanceStudio })))
const CurrencyFormatter = lazy(() => import("./components/tools/finance/CurrencyFormatter").then(m => ({ default: m.CurrencyFormatter })))
const GstCalc = lazy(() => import("./components/tools/finance/GstCalc").then(m => ({ default: m.GstCalc })))



// PDF Tools
const MergePdf = lazy(() => import("./components/tools/pdf/MergePdf").then(m => ({ default: m.MergePdf })))
const SplitPdf = lazy(() => import("./components/tools/pdf/SplitPdf").then(m => ({ default: m.SplitPdf })))
const PdfExporter = lazy(() => import("./components/tools/pdf/PdfExporter").then(m => ({ default: m.PdfExporter })))
const CompressPdf = lazy(() => import("./components/tools/pdf/CompressPdf").then(m => ({ default: m.CompressPdf })))
const PdfPassword = lazy(() => import("./components/tools/pdf/PdfPassword").then(m => ({ default: m.PdfPassword })))
const ReorderPdf = lazy(() => import("./components/tools/pdf/ReorderPdf").then(m => ({ default: m.ReorderPdf })))
const PdfWatermark = lazy(() => import("./components/tools/pdf/PdfWatermark").then(m => ({ default: m.PdfWatermark })))
const PdfEditor = lazy(() => import("./components/tools/pdf/PdfEditor").then(m => ({ default: m.PdfEditor })))
const ImagesToPdf = lazy(() => import("./components/tools/pdf/ImagesToPdf").then(m => ({ default: m.ImagesToPdf })))
const PdfRotate = lazy(() => import("./components/tools/pdf/PdfRotate").then(m => ({ default: m.PdfRotate })))
const PdfFlatten = lazy(() => import("./components/tools/pdf/PdfFlatten").then(m => ({ default: m.PdfFlatten })))
const PdfCrop = lazy(() => import("./components/tools/pdf/PdfCrop").then(m => ({ default: m.PdfCrop })))
const PdfNup = lazy(() => import("./components/tools/pdf/PdfNup").then(m => ({ default: m.PdfNup })))
const RemoveBlankPages = lazy(() => import("./components/tools/pdf/RemoveBlankPages").then(m => ({ default: m.RemoveBlankPages })))
const PdfFontExtractor = lazy(() => import("./components/tools/pdf/PdfFontExtractor").then(m => ({ default: m.PdfFontExtractor })))

// Developer Tools
const CodeFormatterStudio = lazy(() => import("./components/tools/dev/CodeFormatterStudio").then(m => ({ default: m.CodeFormatterStudio })))
const HttpRequestBuilder = lazy(() => import("./components/tools/dev/HttpRequestBuilder").then(m => ({ default: m.HttpRequestBuilder })))
const ColorStudio = lazy(() => import("./components/tools/dev/ColorStudio").then(m => ({ default: m.ColorStudio })))
const Base64Studio = lazy(() => import("./components/tools/dev/Base64Studio").then(m => ({ default: m.Base64Studio })))
const UuidHashGenerator = lazy(() => import("./components/tools/dev/UuidHashGenerator").then(m => ({ default: m.UuidHashGenerator })))
const RegexTester = lazy(() => import("./components/tools/dev/RegexTester").then(m => ({ default: m.RegexTester })))
const TimestampConverter = lazy(() => import("./components/tools/dev/TimestampConverter").then(m => ({ default: m.TimestampConverter })))
const JwtDecoder = lazy(() => import("./components/tools/dev/JwtDecoder").then(m => ({ default: m.JwtDecoder })))
const UrlEncoder = lazy(() => import("./components/tools/dev/UrlEncoder").then(m => ({ default: m.UrlEncoder })))
const CronBuilder = lazy(() => import("./components/tools/dev/CronBuilder").then(m => ({ default: m.CronBuilder })))
const EnvEditor = lazy(() => import("./components/tools/dev/EnvEditor").then(m => ({ default: m.EnvEditor })))
const YamlJsonConverter = lazy(() => import("./components/tools/dev/YamlJsonConverter").then(m => ({ default: m.YamlJsonConverter })))
const HtmlEntityEncoder = lazy(() => import("./components/tools/dev/HtmlEntityEncoder").then(m => ({ default: m.HtmlEntityEncoder })))
const ColorContrastChecker = lazy(() => import("./components/tools/dev/ColorContrastChecker").then(m => ({ default: m.ColorContrastChecker })))
const CssEffectsBuilder = lazy(() => import("./components/tools/dev/CssEffectsBuilder").then(m => ({ default: m.CssEffectsBuilder })))
const JsonSchemaValidator = lazy(() => import("./components/tools/dev/JsonSchemaValidator").then(m => ({ default: m.JsonSchemaValidator })))

// Video Tools
const VideoCompressor = lazy(() => import("./components/tools/video/VideoCompressor").then(m => ({ default: m.VideoCompressor })))
const AudioStudio = lazy(() => import("./components/tools/video/AudioStudio").then(m => ({ default: m.AudioStudio })))
const VideoToGif = lazy(() => import("./components/tools/video/VideoToGif").then(m => ({ default: m.VideoToGif })))
const AudioWaveform = lazy(() => import("./components/tools/video/AudioWaveform").then(m => ({ default: m.AudioWaveform })))
const VideoThumbnails = lazy(() => import("./components/tools/video/VideoThumbnails").then(m => ({ default: m.VideoThumbnails })))
const VideoTrimmer = lazy(() => import("./components/tools/video/VideoTrimmer").then(m => ({ default: m.VideoTrimmer })))
const VideoSpeed = lazy(() => import("./components/tools/video/VideoSpeed").then(m => ({ default: m.VideoSpeed })))


// Text Tools
const MarkdownPreview = lazy(() => import("./components/tools/text/MarkdownPreview").then(m => ({ default: m.MarkdownPreview })))
const TextAnalyser = lazy(() => import("./components/tools/text/TextAnalyser").then(m => ({ default: m.TextAnalyser })))
const TextDiff = lazy(() => import("./components/tools/text/TextDiff").then(m => ({ default: m.TextDiff })))
const CsvJsonConverter = lazy(() => import("./components/tools/text/CsvJsonConverter").then(m => ({ default: m.CsvJsonConverter })))
const LoremIpsumGenerator = lazy(() => import("./components/tools/text/LoremIpsumGenerator").then(m => ({ default: m.LoremIpsumGenerator })))
const PasswordGenerator = lazy(() => import("./components/tools/text/PasswordGenerator").then(m => ({ default: m.PasswordGenerator })))
const StringCaseConverter = lazy(() => import("./components/tools/text/StringCaseConverter").then(m => ({ default: m.StringCaseConverter })))
const WordFrequency = lazy(() => import("./components/tools/text/WordFrequency").then(m => ({ default: m.WordFrequency })))
const NumberBaseConverter = lazy(() => import("./components/tools/text/NumberBaseConverter").then(m => ({ default: m.NumberBaseConverter })))
const FakeData = lazy(() => import("./components/tools/text/FakeData").then(m => ({ default: m.FakeData })))
const TomlJson = lazy(() => import("./components/tools/text/TomlJson").then(m => ({ default: m.TomlJson })))
const UnicodeExplorer = lazy(() => import("./components/tools/text/UnicodeExplorer").then(m => ({ default: m.UnicodeExplorer })))
const NameFormatter = lazy(() => import("./components/tools/text/NameFormatter").then(m => ({ default: m.NameFormatter })))
const TableToMd = lazy(() => import("./components/tools/text/TableToMd").then(m => ({ default: m.TableToMd })))
const ReadmeViewer = lazy(() => import("./components/tools/text/ReadmeViewer").then(m => ({ default: m.ReadmeViewer })))
const Pastebin = lazy(() => import("./components/tools/text/Pastebin").then(m => ({ default: m.Pastebin })))

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
            <Route path="/tools/ai/screenshot-to-game-code" element={<ScreenshotToGameCode />} />
            <Route path="/tools/ai/alt-text" element={<AltTextStudio />} />
            <Route path="/tools/ai/summarizer" element={<PdfSummariser />} />
            <Route path="/tools/ai/bg-replacer" element={<BgReplacer />} />
            <Route path="/tools/ai/resume" element={<AiResumeReviewer />} />
            <Route path="/tools/ai/font-match" element={<FontDetectorVision />} />
            <Route path="/tools/ai/explain-ui" element={<ExplainUi />} />
            <Route path="/tools/ai/caption" element={<ImageCaptionGenerator />} />
            <Route path="/tools/ai/mock-api" element={<MockApiGenerator />} />
            <Route path="/tools/ai/providers" element={<ApiKeysPage />} />

            {/* Image Tools */}
            <Route path="/tools/image/effects" element={<ImageEffects />} />
            <Route path="/tools/image/remove-bg" element={<RemoveBg />} />
            <Route path="/tools/image/compress" element={<ImageCompressor />} />
            <Route path="/tools/image/convert" element={<FormatConverter />} />
            <Route path="/tools/image/crop" element={<ImageCrop />} />
            <Route path="/tools/image/watermark-studio" element={<WatermarkStudio />} />
            <Route path="/tools/image/palette" element={<ColorPalette />} />
            <Route path="/tools/image/censor" element={<SmartCensor />} />
            <Route path="/tools/image/privacy" element={<ImagePrivacy />} />
            <Route path="/tools/image/code-generator" element={<CodeGenerator />} />
            <Route path="/tools/image/meme" element={<MemeGenerator />} />
            <Route path="/tools/image/upscale" element={<AiUpscaler />} />
            <Route path="/tools/image/ocr" element={<OcrExtractor />} />
            <Route path="/tools/image/sketch" element={<ImageToSketch />} />
            <Route path="/tools/image/social-resizer" element={<SocialResizer />} />
            <Route path="/tools/image/noise" element={<NoiseGrain />} />
            <Route path="/tools/image/pixel-art" element={<PixelArt />} />
            <Route path="/tools/image/ascii" element={<AsciiArt />} />
            <Route path="/tools/image/slider" element={<BeforeAfterSlider />} />
            <Route path="/tools/image/gif-maker" element={<GifMaker />} />
            <Route path="/tools/image/sprite-slicer" element={<SpriteSlicer />} />

            <Route path="/tools/image/color-blind" element={<ColorBlindness />} />
            <Route path="/tools/image/collage" element={<CollageMaker />} />



            {/* PDF Tools */}
            <Route path="/tools/pdf/merge" element={<MergePdf />} />
            <Route path="/tools/pdf/split" element={<SplitPdf />} />
            <Route path="/tools/pdf/compress" element={<CompressPdf />} />
            <Route path="/tools/pdf/password" element={<PdfPassword />} />
            <Route path="/tools/pdf/exporter" element={<PdfExporter />} />
            <Route path="/tools/pdf/images-to-pdf" element={<ImagesToPdf />} />
            <Route path="/tools/pdf/editor" element={<PdfEditor />} />
            <Route path="/tools/pdf/reorder" element={<ReorderPdf />} />
            <Route path="/tools/pdf/watermark" element={<PdfWatermark />} />
            <Route path="/tools/pdf/rotate" element={<PdfRotate />} />
            <Route path="/tools/pdf/flatten" element={<PdfFlatten />} />
            <Route path="/tools/pdf/crop" element={<PdfCrop />} />
            <Route path="/tools/pdf/n-up" element={<PdfNup />} />
            <Route path="/tools/pdf/remove-blank" element={<RemoveBlankPages />} />
            <Route path="/tools/pdf/fonts" element={<PdfFontExtractor />} />

            {/* Developer Tools */}
            <Route path="/tools/dev/formatter" element={<CodeFormatterStudio />} />
            <Route path="/tools/dev/http-builder" element={<HttpRequestBuilder />} />
            <Route path="/tools/dev/color" element={<ColorStudio />} />
            <Route path="/tools/dev/gradient" element={<ColorStudio />} />
            <Route path="/tools/dev/base64-studio" element={<Base64Studio />} />
            <Route path="/tools/dev/uuid-hash" element={<UuidHashGenerator />} />
            <Route path="/tools/dev/regex" element={<RegexTester />} />
            <Route path="/tools/dev/timestamp" element={<TimestampConverter />} />
            <Route path="/tools/dev/jwt" element={<JwtDecoder />} />
            <Route path="/tools/dev/url" element={<UrlEncoder />} />
            <Route path="/tools/dev/cron" element={<CronBuilder />} />
            <Route path="/tools/dev/css-units" element={<UnitStudio />} />
            <Route path="/tools/dev/env" element={<EnvEditor />} />
            <Route path="/tools/dev/json-to-csv" element={<CsvJsonConverter />} />
            <Route path="/tools/dev/yaml-json" element={<YamlJsonConverter />} />
            <Route path="/tools/dev/html-entity" element={<HtmlEntityEncoder />} />
            <Route path="/tools/dev/color-contrast" element={<ColorContrastChecker />} />
            <Route path="/tools/dev/css-effects" element={<CssEffectsBuilder />} />
            <Route path="/tools/dev/json-schema" element={<JsonSchemaValidator />} />

            {/* Video Tools */}
            <Route path="/tools/video/compress" element={<VideoCompressor />} />
            <Route path="/tools/video/audio-studio" element={<AudioStudio />} />
            <Route path="/tools/video/to-gif" element={<VideoToGif />} />
            <Route path="/tools/video/waveform" element={<AudioWaveform />} />
            <Route path="/tools/video/thumbnails" element={<VideoThumbnails />} />
            <Route path="/tools/video/trimmer" element={<VideoTrimmer />} />
            <Route path="/tools/video/speed" element={<VideoSpeed />} />



            {/* Text Tools */}
            <Route path="/tools/text/md-preview" element={<MarkdownPreview />} />
            <Route path="/tools/text/analyser" element={<TextAnalyser />} />
            <Route path="/tools/text/diff" element={<TextDiff />} />
            <Route path="/tools/text/csv-json" element={<CsvJsonConverter />} />
            <Route path="/tools/text/lorem" element={<LoremIpsumGenerator />} />
            <Route path="/tools/text/password" element={<PasswordGenerator />} />
            <Route path="/tools/text/string-case" element={<StringCaseConverter />} />
            <Route path="/tools/text/word-frequency" element={<WordFrequency />} />
            <Route path="/tools/text/number-base" element={<NumberBaseConverter />} />
            <Route path="/tools/text/fake-data" element={<FakeData />} />
            <Route path="/tools/text/toml-json" element={<TomlJson />} />
            <Route path="/tools/text/unicode" element={<UnicodeExplorer />} />
            <Route path="/tools/text/name-case" element={<NameFormatter />} />
            <Route path="/tools/text/table-to-md" element={<TableToMd />} />
            <Route path="/tools/text/readme" element={<ReadmeViewer />} />
            <Route path="/tools/text/pastebin" element={<Pastebin />} />
            
            {/* Browser Tools */}
            <Route path="/tools/browser/dns" element={<DnsLookup />} />
            <Route path="/tools/browser/ip" element={<IpLookup />} />
            <Route path="/tools/browser/ssl" element={<SslChecker />} />
            <Route path="/tools/browser/ua" element={<UaParser />} />
            <Route path="/tools/browser/mime" element={<MimeLookup />} />
            <Route path="/tools/browser/subnet" element={<SubnetCalculator />} />
            <Route path="/tools/browser/link-shortener" element={<LinkShortener />} />

            {/* Security Tools */}
            <Route path="/tools/security/totp" element={<TotpGen />} />
            <Route path="/tools/security/bcrypt" element={<BcryptHasher />} />
            <Route path="/tools/security/rsa" element={<RsaGen />} />
            <Route path="/tools/security/checksum" element={<ChecksumVerify />} />

            {/* Math Tools */}
            <Route path="/tools/math/matrix" element={<MatrixCalc />} />
            <Route path="/tools/math/units" element={<UnitStudio />} />
            <Route path="/tools/math/scientific" element={<ScientificCalc />} />
            <Route path="/tools/math/percentage" element={<PercentageCalc />} />
            <Route path="/tools/math/aspect-ratio" element={<AspectRatioCalc />} />

            {/* Finance Tools */}
            <Route path="/tools/finance/studio" element={<FinanceStudio />} />
            <Route path="/tools/finance/currency" element={<CurrencyFormatter />} />
            <Route path="/tools/finance/gst" element={<GstCalc />} />


            
            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
