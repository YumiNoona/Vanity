import { 
  Image, Layers, Crop, CheckCircle, FileText, SplitSquareHorizontal, 
  Minimize2, Lock, Images, Eraser, FileCode, Pipette, 
  ShieldAlert, ShieldCheck, QrCode, Barcode, Sparkles, 
  ListOrdered, Stamp, Maximize2, Languages, FileEdit, FileImage,
  Monitor, Layout, CircleUser, FileType, Pencil, Smartphone,
  FileSpreadsheet, GitCompare, RotateCw, Scissors, Braces, 
  Palette, Hash, Video, Zap, ArrowLeftRight, FileJson, 
  Square, FileMinus, Binary, Contrast, Type, Copy,
  Grid, Search, Diff, Key, BrainCircuit, Mic, Music, Eye, FileCheck,
  ImagePlus, Sigma, Globe, Code2, PenTool
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
  { id: "ocr", title: "OCR — Image to Text", description: "Extract text from images using AI-powered OCR.", icon: Languages, path: "/tools/image/ocr" },
  { id: "svg-to-raster", title: "SVG to PNG / JPG", description: "Convert vector SVGs to raster formats at any resolution.", icon: FileType, path: "/tools/image/svg-to-raster" },
  { id: "image-effects", title: "Image Effects", description: "Apply filters, adjust brightness, contrast, and more.", icon: Layers, path: "/tools/image/effects" },
  { id: "image-compressor", title: "Image Compressor", description: "Compress images rapidly without losing quality.", icon: Minimize2, path: "/tools/image/compress", keywords: ["shrink", "size", "kb"] },
  { id: "crop-resize", title: "Crop & Resize", description: "Easily crop and resize free-hand or to specific dimensions.", icon: Crop, path: "/tools/image/crop" },
  { id: "palette", title: "Color Palette", description: "Extract design palettes from any photograph.", icon: Pipette, path: "/tools/image/palette" },
  { id: "censor", title: "Smart Censor", description: "Pixelate sensitive information and faces.", icon: ShieldAlert, path: "/tools/image/censor" },
  { id: "exif-sanitizer", title: "EXIF Sanitizer", description: "Remove metadata for maximum privacy.", icon: ShieldCheck, path: "/tools/image/exif-sanitizer", keywords: ["metadata", "privacy", "gps"] },
  { id: "meme", title: "Meme Generator", description: "Create viral memes with custom text and templates.", icon: Sparkles, path: "/tools/image/meme" },
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
]

export const AI_TOOLS: Tool[] = [
  { id: "ai-screenshot-to-code", title: "Screenshot to Code", description: "UI screenshot → HTML + Tailwind via Claude Vision.", icon: Monitor, path: "/tools/ai/screenshot-to-code", isPopular: true, keywords: ["ui", "frontend", "dev"] },
  { id: "ai-alt-text", title: "AI Alt-Text Writer", description: "Generate accessibility alt text for any image automatically.", icon: BrainCircuit, path: "/tools/ai/alt-text", keywords: ["seo", "accessibility", "description"] },
  { id: "ai-summarizer", title: "AI PDF Summarizer", description: "Extract and summarize PDF content using Claude.", icon: Sigma, path: "/tools/ai/summarizer", keywords: ["tl;dr", "reading", "study"] },
  { id: "ai-bg-replacer", title: "AI Background Replacer", description: "Remove BG and describe a new scene to Claude.", icon: ImagePlus, path: "/tools/ai/bg-replacer", keywords: ["generative", "creative", "edit"] },
]

export const DEV_TOOLS: Tool[] = [
  { id: "json-formatter", title: "JSON formatter", description: "Prettify, minify, and validate JSON data.", icon: Braces, path: "/tools/dev/json", keywords: ["pretty", "minify", "validate"] },
  { id: "color-picker", title: "Color converter", description: "Pick any color, convert between HEX, RGB, HSL, CMYK.", icon: Palette, path: "/tools/dev/color" },
  { id: "favicon", title: "Favicon generator", description: "Convert an image to a multi-size .zip of icons.", icon: FileCode, path: "/tools/dev/favicon" },
  { id: "uuid-hash", title: "UUID & hash generator", description: "Generate UUIDs, MD5, and SHA-256 hashes.", icon: Key, path: "/tools/dev/uuid-hash" },
  { id: "css-gradient", title: "CSS gradient builder", description: "Build linear or radial gradients visually.", icon: Zap, path: "/tools/dev/gradient" },
  { id: "base64-studio", title: "Base64 Studio", description: "Encode/Decode text, images, or files to base64 strings.", icon: Code2, path: "/tools/dev/base64-studio", keywords: ["string", "encode", "embed"] },
]

export const VIDEO_TOOLS: Tool[] = [
  { id: "video-compressor", title: "Video compressor", description: "Compress MP4/WebM files locally with FFMPEG.", icon: Minimize2, path: "/tools/video/compress", isPopular: true },
  { id: "audio-converter", title: "Audio converter", description: "Convert between MP3, WAV, OGG, M4A via FFMPEG.", icon: Music, path: "/tools/video/audio-convert" },
  { id: "video-to-mp3", title: "Video to MP3", description: "Strip audio tracks from any video file instantly.", icon: Mic, path: "/tools/video/video-to-mp3" },
  { id: "video-to-gif", title: "Video to GIF", description: "Clip short video captures and save as GIFs.", icon: Video, path: "/tools/video/to-gif" },
]

export const TEXT_TOOLS: Tool[] = [
  { id: "markdown-preview", title: "Markdown preview", description: "Paste markdown, get a live rendered preview.", icon: Eye, path: "/tools/text/md-preview" },
  { id: "text-analyser", title: "Text analyser", description: "Word count, reading time, and top words analysis.", icon: Search, path: "/tools/text/analyser" },
  { id: "text-diff", title: "Text diff checker", description: "Compare two texts and see additions/removals.", icon: Diff, path: "/tools/text/diff" },
  { id: "csv-json", title: "CSV ↔ JSON converter", description: "Convert spreadsheet data to JSON and back.", icon: ArrowLeftRight, path: "/tools/text/csv-json" },
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

