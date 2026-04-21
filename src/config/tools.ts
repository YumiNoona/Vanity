import { 
  Image, Layers, Crop, CheckCircle, FileText, SplitSquareHorizontal, 
  Minimize2, Lock, Images, Eraser, FileCode, Pipette, 
  ShieldAlert, ShieldCheck, QrCode, MessageSquare, Sparkles, 
  ListOrdered, Stamp, Maximize2, Languages, FileEdit, FileImage,
  Monitor, Layout, CircleUser, FileType, Pencil, Smartphone,
  FileSpreadsheet, GitCompare, RotateCw, Scissors, Braces, 
  Palette, Hash, Video, Zap, ArrowLeftRight, FileJson, 
  Square, FileMinus, Binary, Contrast, Type, Copy,
  Grid, Search, Diff, Key, BrainCircuit, Mic, Music, Eye, FileCheck,
  ImagePlus, Sigma, Globe, Code2, PenTool,
  Terminal, Clock, Link2, Calendar, Code, AlignLeft, KeyRound, BarChart3,
  Microscope, EyeOff, PaintBucket, ImagePlay, FastForward, Award, Database
} from "lucide-react"

// Types to allow easier custom icons
export type ToolIcon = any;

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: ToolIcon;
  path: string;
  isPopular?: boolean;
  keywords?: string[]; // For smart search
}

export const IMAGE_TOOLS: Tool[] = [
  { id: "remove-bg", title: "Remove Background", description: "AI-powered background removal running locally in your browser.", icon: Image, path: "/tools/image/remove-bg", isPopular: true, keywords: ["bg", "transparent", "cutout"] },
  { id: "upscale", title: "AI Image Upscale", description: "Enhance resolution by 2x or 4x with sharp edges.", icon: Maximize2, path: "/tools/image/upscale", isPopular: true, keywords: ["enlarge", "resolution", "4k"] },
  { id: "watermark-studio", title: "Watermark Studio", description: "Comprehensive tool to add protection or remove unwanted watermarks.", icon: Stamp, path: "/tools/image/watermark-studio", keywords: ["watermark", "remove", "add", "copyright"] },
  { id: "code-generator", title: "Code Generator", description: "Generate high-res QR codes and standard barcodes for any data.", icon: QrCode, path: "/tools/image/code-generator", keywords: ["qr", "barcode", "link", "matrix"] },
  { id: "gif-maker", title: "GIF Maker", description: "Combine images into a perfectly timed animated GIF.", icon: Images, path: "/tools/image/gif-maker", keywords: ["animation", "loop", "frames"] },
  { id: "noise-grain", title: "Noise & Grain", description: "Add film grain, noise, or vintage textures to any photo.", icon: Sparkles, path: "/tools/image/noise", keywords: ["texture", "film", "retro"] },
  { id: "pixel-art", title: "Pixel Art Converter", description: "Downscale any image into chunky retro pixel art.", icon: Binary, path: "/tools/image/pixel-art", keywords: ["retro", "8bit", "game"] },
  { id: "duotone", title: "Duotone Tint", description: "Map image shadows and highlights to two custom colors.", icon: Contrast, path: "/tools/image/duotone" },
  { id: "ascii", title: "ASCII Art Converter", description: "Turn any image into a text-based ASCII rendering.", icon: Type, path: "/tools/image/ascii" },
  { id: "social-resizer", title: "Social Media Resizer", description: "One-click resize for Instagram, Twitter, and LinkedIn.", icon: Smartphone, path: "/tools/image/social-resizer", keywords: ["resize", "crop", "ig", "twitter"] },
  { id: "image-to-sketch", title: "Image to Sketch", description: "Turn any photo into a pencil-sketch style illustration.", icon: Pencil, path: "/tools/image/sketch", keywords: ["draw", "pencil", "art"] },
  { id: "sprite-slicer", title: "Sprite Sheet Slicer", description: "Cut a sprite grid into individual files in a zip.", icon: Grid, path: "/tools/image/sprite-slicer" },
  { id: "before-after", title: "Before & After Slider", description: "Create an interactive slider to compare two images side-by-side.", icon: SplitSquareHorizontal, path: "/tools/image/slider" },
  { id: "ocr", title: "OCR — Image to Text", description: "Extract text from images using AI-powered OCR.", icon: Languages, path: "/tools/image/ocr" },
  { id: "svg-to-raster", title: "SVG to PNG / JPG", description: "Convert vector SVGs to raster formats at any resolution.", icon: FileType, path: "/tools/image/svg-to-raster" },
  { id: "format-converter", title: "Format Converter", description: "Convert images between JPG, PNG, WEBP, and more.", icon: ArrowLeftRight, path: "/tools/image/convert" },
  { id: "image-effects", title: "Image Effects", description: "Apply filters, adjust brightness, contrast, and more.", icon: Layers, path: "/tools/image/effects" },
  { id: "image-compressor", title: "Image Compressor", description: "Compress images rapidly without losing quality.", icon: Minimize2, path: "/tools/image/compress", keywords: ["shrink", "size", "kb"] },
  { id: "crop-resize", title: "Crop & Resize", description: "Easily crop and resize free-hand or to specific dimensions.", icon: Crop, path: "/tools/image/crop" },
  { id: "palette", title: "Color Palette", description: "Extract design palettes from any photograph.", icon: Pipette, path: "/tools/image/palette" },
  { id: "censor", title: "Smart Censor", description: "Pixelate sensitive information and faces.", icon: ShieldAlert, path: "/tools/image/censor" },
  { id: "exif-sanitizer", title: "EXIF Sanitizer", description: "Remove metadata for maximum privacy.", icon: ShieldCheck, path: "/tools/image/exif-sanitizer", keywords: ["metadata", "privacy", "gps"] },
  { id: "meme", title: "Meme Generator", description: "Create viral memes with custom text and templates.", icon: MessageSquare, path: "/tools/image/meme" },
  { id: "image-diff", title: "Image Difference tool", description: "Compute exact pixel deviations via XOR overlays.", icon: Microscope, path: "/tools/image/diff", keywords: ["compare", "xor", "overlay"] },
  { id: "color-blind", title: "Color Blind Simulator", description: "Simulate exact visual perception using direct pixel matrices.", icon: EyeOff, path: "/tools/image/color-blind", keywords: ["accessibility", "protanopia", "sight"] },
  { id: "icc-stripper", title: "ICC Profile Stripper", description: "Normalize images to sRGB spaces stripping embedded data.", icon: PaintBucket, path: "/tools/image/icc-stripper", keywords: ["color", "srgb", "profile"] },
  { id: "bulk-resize", title: "Bulk Image Resizer", description: "Resize entire batches locally via memory-safe sequential queues.", icon: Layers, path: "/tools/image/bulk-resize", keywords: ["batch", "scale", "dimensions"] },
  { id: "heic-to-jpg", title: "HEIC to JPG", description: "Batch convert Apple HEIC photos instantly.", icon: ImagePlus, path: "/tools/image/heic-to-jpg", keywords: ["iphone", "apple", "convert"] },
]

export const PDF_TOOLS: Tool[] = [
  { id: "merge-pdf", title: "Merge PDFs", description: "Combine multiple PDFs into a single file easily.", icon: Layers, path: "/tools/pdf/merge", isPopular: true, keywords: ["combine", "join", "add"] },
  { id: "pdf-editor", title: "PDF Editor", description: "Annotate, draw, and modify PDF content directly.", icon: FileEdit, path: "/tools/pdf/editor", isPopular: true, keywords: ["edit", "draw", "modify"] },
  { id: "images-to-pdf", title: "Images to PDF", description: "Combine multiple images into a professional PDF.", icon: FileImage, path: "/tools/pdf/images-to-pdf", isPopular: true },
  { id: "pdf-to-images", title: "PDF to Images", description: "Export each PDF page as a high-quality PNG or JPG.", icon: Images, path: "/tools/pdf/to-images" },
  { id: "pdf-to-text", title: "PDF to Text", description: "Extract raw text content from any PDF, page by page.", icon: FileText, path: "/tools/pdf/to-text" },
  { id: "pdf-to-word", title: "PDF to Word", description: "Extract text and layout into an editable .docx file.", icon: FileText, path: "/tools/pdf/to-word", keywords: ["doc", "docx", "office"] },
  { id: "pdf-watermark", title: "PDF Watermark", description: "Stamp text or logos across all PDF pages.", icon: Stamp, path: "/tools/pdf/watermark" },
  { id: "rotate-pdf", title: "Rotate PDF Pages", description: "Rotate individual or all pages 90°, 180°, or 270°.", icon: RotateCw, path: "/tools/pdf/rotate" },
  { id: "flatten-pdf", title: "Flatten PDF", description: "Convert interactive form fields into permanent page content.", icon: FileCheck, path: "/tools/pdf/flatten" },
  { id: "crop-pdf", title: "Crop PDF Pages", description: "Adjust page margins to remove whitespace or crop content.", icon: Crop, path: "/tools/pdf/crop" },
  { id: "remove-blank-pages", title: "Remove Blank Pages", description: "Auto-detect and strip empty/white pages from a PDF.", icon: FileMinus, path: "/tools/pdf/remove-blank" },
  { id: "n-up", title: "N-up Imposition", description: "Print 2 or 4 pages per sheet to save paper.", icon: Layout, path: "/tools/pdf/n-up" },
  { id: "split-pdf", title: "Split PDF", description: "Extract pages from your PDF into separate files.", icon: SplitSquareHorizontal, path: "/tools/pdf/split" },
  { id: "compress-pdf", title: "Compress PDF", description: "Reduce file size while optimizing for quality.", icon: Minimize2, path: "/tools/pdf/compress" },
  { id: "pdf-password", title: "PDF Passwords", description: "Add or remove password protection from PDFs.", icon: Lock, path: "/tools/pdf/password" },
  { id: "reorder-pdf", title: "Reorder PDF", description: "Drag and drop to rearrange pages in your PDF.", icon: ListOrdered, path: "/tools/pdf/reorder" },
  { id: "pdf-fonts", title: "PDF Font Extractor", description: "Extract subsets and map embedded binary typography layers.", icon: Type, path: "/tools/pdf/fonts", keywords: ["ttf", "typography", "embedded"] },
]

export const AI_TOOLS: Tool[] = [
  { id: "ai-screenshot-to-code", title: "Screenshot to Code", description: "UI screenshot → HTML + Tailwind via Claude Vision.", icon: Monitor, path: "/tools/ai/screenshot-to-code", isPopular: true, keywords: ["ui", "frontend", "dev"] },
  { id: "ai-screenshot-to-game-code", title: "Screenshot to Game Code", description: "Convert code screenshots to Godot, Unity, or Unreal code using Gemini or OCR fallback.", icon: Code2, path: "/tools/ai/screenshot-to-game-code", isPopular: true, keywords: ["godot", "unity", "unreal", "ocr", "gemini"] },
  { id: "ai-alt-text", title: "AI Alt-Text Writer", description: "Generate accessibility alt text for any image automatically.", icon: BrainCircuit, path: "/tools/ai/alt-text", keywords: ["seo", "accessibility", "description"] },
  { id: "ai-summarizer", title: "AI PDF Summarizer", description: "Extract and summarize PDF content using Claude.", icon: Sigma, path: "/tools/ai/summarizer", keywords: ["tl;dr", "reading", "study"] },
  { id: "ai-bg-replacer", title: "AI Background Replacer", description: "Remove BG and describe a new scene to Claude.", icon: ImagePlus, path: "/tools/ai/bg-replacer", keywords: ["generative", "creative", "edit"] },
  { id: "ai-resume-reviewer", title: "AI Resume Reviewer", description: "Elite recruiter JSON evaluations and visual scorecards.", icon: Award, path: "/tools/ai/resume", isPopular: true, keywords: ["job", "audit", "cv"] },
  { id: "vision-font-detector", title: "Font Matcher (Vision)", description: "Heuristically determine typography via image layers.", icon: Type, path: "/tools/ai/font-match", keywords: ["font", "type", "scan"] },
  { id: "explain-ui", title: "Explain UI", description: "Deconstruct interface screenshots into hierarchy trees.", icon: Monitor, path: "/tools/ai/explain-ui", keywords: ["design", "ux", "layout"] },
  { id: "alt-text-batch", title: "Batch Alt Text", description: "Mass-generate SEO descriptions queued sequentially.", icon: Images, path: "/tools/ai/alt-text-batch", keywords: ["bulk", "seo", "vision"] },
  { id: "caption-generator", title: "Caption Generator", description: "Generate contextual social captions securely.", icon: MessageSquare, path: "/tools/ai/caption", keywords: ["social", "instagram", "post"] },
  { id: "mock-api-generator", title: "Mock JSON Generator", description: "Synthesize strict deterministic schema arrays seamlessly.", icon: Database, path: "/tools/ai/mock-api", keywords: ["dummy", "data", "scaffold"] },
  { id: "ai-providers", title: "AI Keys", description: "Manage Gemini, Anthropic, OpenAI, and Groq keys in one place.", icon: KeyRound, path: "/tools/ai/providers", keywords: ["api", "keys", "providers"] },
]

export const DEV_TOOLS: Tool[] = [
  { id: "json-formatter", title: "JSON Formatter", description: "Prettify, minify, and validate JSON data.", icon: Braces, path: "/tools/dev/json", keywords: ["pretty", "minify", "validate"] },
  { id: "color-picker", title: "Color Converter", description: "Pick any color, convert between HEX, RGB, HSL, CMYK.", icon: Palette, path: "/tools/dev/color" },
  { id: "favicon", title: "Favicon Generator", description: "Convert an image to a multi-size .zip of icons.", icon: FileCode, path: "/tools/dev/favicon" },
  { id: "uuid-hash", title: "UUID & Hash Generator", description: "Generate UUIDs, MD5, and SHA-256 hashes.", icon: Key, path: "/tools/dev/uuid-hash" },
  { id: "css-gradient", title: "CSS Gradient Builder", description: "Build linear or radial gradients visually.", icon: Zap, path: "/tools/dev/gradient" },
  { id: "base64-studio", title: "Base64 Studio", description: "Encode/Decode text, images, or files to base64 strings.", icon: Code2, path: "/tools/dev/base64-studio", keywords: ["string", "encode", "embed"] },
  { id: "regex-tester", title: "Regex Tester", description: "Live regex matching with highlighting, group capture, and flags.", icon: Terminal, path: "/tools/dev/regex", keywords: ["test", "match", "regular"] },
  { id: "timestamp-converter", title: "Timestamp Converter", description: "Unix epoch to human-readable date and back with timezones.", icon: Clock, path: "/tools/dev/timestamp", keywords: ["time", "unix", "date"] },
  { id: "jwt-decoder", title: "JWT Decoder", description: "Decode JSON Web Tokens visually locally without validation.", icon: ShieldCheck, path: "/tools/dev/jwt", keywords: ["token", "auth", "base64"] },
  { id: "url-encoder", title: "URL Encoder / Decoder", description: "Encode or decode query strings and full URLs safely.", icon: Link2, path: "/tools/dev/url" },
  { id: "cron-builder", title: "CRON Expression Tester", description: "Validate CRON strings and preview immediate run times.", icon: Calendar, path: "/tools/dev/cron", keywords: ["schedule", "time", "job"] },
  { id: "html-formatter", title: "HTML Formatter", description: "Prettify or minify raw HTML structures instantly.", icon: Code, path: "/tools/dev/html", keywords: ["minify", "prettify", "indent"] },
  { id: "css-unit-converter", title: "CSS Unit Converter", description: "Convert px to rem, em, vw, vh instantly based on rules.", icon: Scissors, path: "/tools/dev/css-units", keywords: ["size", "font", "rem"] },
]

export const VIDEO_TOOLS: Tool[] = [
  { id: "video-compressor", title: "Video Compressor", description: "Compress MP4/WebM files locally with FFMPEG.", icon: Minimize2, path: "/tools/video/compress", isPopular: true },
  { id: "audio-converter", title: "Audio Converter", description: "Convert between MP3, WAV, OGG, M4A via FFMPEG.", icon: Music, path: "/tools/video/audio-convert" },
  { id: "video-to-mp3", title: "Video to MP3", description: "Strip audio tracks from any video file instantly.", icon: Mic, path: "/tools/video/video-to-mp3" },
  { id: "video-to-gif", title: "Video to GIF", description: "Clip short video captures and save as GIFs.", icon: Video, path: "/tools/video/to-gif" },
  { id: "audio-waveform", title: "Audio Waveform Visualizer", description: "Visually inspect audio tracks and precision trim segments.", icon: FastForward, path: "/tools/video/waveform", keywords: ["trim", "cut", "mp3"] },
  { id: "video-thumbnails", title: "Video Grid Extractor", description: "Rapidly pull high-resolution thumbnail sheets securely.", icon: ImagePlay, path: "/tools/video/thumbnails", keywords: ["grid", "frames", "snapshot"] },
  { id: "video-trimmer", title: "Video Trimmer", description: "Slice and exact clip segments via native stream-copying.", icon: Scissors, path: "/tools/video/trimmer", keywords: ["cut", "slice", "mp4"] },
]

export const TEXT_TOOLS: Tool[] = [
  { id: "markdown-preview", title: "Markdown Preview", description: "Paste markdown, get a live rendered preview.", icon: Eye, path: "/tools/text/md-preview" },
  { id: "text-analyser", title: "Text Analyser", description: "Word count, reading time, and top words analysis.", icon: Search, path: "/tools/text/analyser" },
  { id: "text-diff", title: "Text Diff Checker", description: "Compare two texts and see additions/removals.", icon: Diff, path: "/tools/text/diff" },
  { id: "csv-json", title: "CSV ↔ JSON Converter", description: "Convert spreadsheet data to JSON and back.", icon: ArrowLeftRight, path: "/tools/text/csv-json" },
  { id: "lorem-ipsum", title: "Lorem Ipsum Generator", description: "Customizable placeholder text generator natively.", icon: AlignLeft, path: "/tools/text/lorem" },
  { id: "password-generator", title: "Password Generator", description: "Generate strong passwords with length and symbol configs.", icon: KeyRound, path: "/tools/text/password", isPopular: true, keywords: ["secure", "strong", "random"] },
  { id: "string-case", title: "String Case Converter", description: "Convert between camelCase, snake_case, PascalCase simultaneously.", icon: Type, path: "/tools/text/string-case" },
  { id: "word-frequency", title: "Word Frequency Counter", description: "Analyze text and visualize word percentages dynamically.", icon: BarChart3, path: "/tools/text/word-frequency" },
  { id: "number-base", title: "Number Base Converter", description: "Live conversions between decimal, binary, hex, and octal.", icon: Hash, path: "/tools/text/number-base" },
]

export const CATEGORIES = [
  { id: "ai", title: "AI Utilities", tools: AI_TOOLS, color: "emerald-500" },
  { id: "image", title: "Image Tools", tools: IMAGE_TOOLS, color: "primary" },
  { id: "pdf", title: "PDF Tools", tools: PDF_TOOLS, color: "accent" },
  { id: "dev", title: "Developer Tools", tools: DEV_TOOLS, color: "blue-500" },
  { id: "video", title: "Video & Audio", tools: VIDEO_TOOLS, color: "purple-500" },
  { id: "text", title: "Text & Data", tools: TEXT_TOOLS, color: "green-500" },
]

export const ALL_TOOLS = [...AI_TOOLS, ...IMAGE_TOOLS, ...PDF_TOOLS, ...DEV_TOOLS, ...VIDEO_TOOLS, ...TEXT_TOOLS]

