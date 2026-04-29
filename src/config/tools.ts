import { 
  Image, Layers, Crop, SplitSquareHorizontal, 
  Minimize2, Lock, Images, FileCode, Pipette, 
  ShieldAlert, ShieldCheck, QrCode, MessageSquare, Sparkles, 
  ListOrdered, Stamp, Maximize2, Languages, FileEdit, FileImage,
  Monitor, Layout, Pencil, Smartphone,
  FileSpreadsheet, RotateCw, Scissors, 
  Palette, Hash, Video, ArrowLeftRight, 
  FileMinus, Binary, Type, Zap,
  Grid, Search, Diff, Key, BrainCircuit, Mic, Eye, FileCheck,
  ImagePlus, Sigma, Code2,
  Terminal, Clock, Link2, Calendar, Code, AlignLeft, KeyRound, BarChart3,
  EyeOff, ImagePlay, FastForward, Award, Database, FileSearch,
  Globe2, MapPin, MonitorSmartphone, Shield, Fingerprint, KeySquare, Calculator,
  Percent, Wallet, Receipt, Repeat, Table,
  BookOpen
} from "lucide-react"

// Types to allow easier custom icons
export type ToolIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: ToolIcon;
  path: string;
  isPopular?: boolean;
  isBulk?: boolean;
  keywords?: string[]; // For smart search
}

export interface Category {
  id: string;
  title: string;
  tools: Tool[];
  color: string;
}

export const IMAGE_TOOLS: Tool[] = [
  { id: "format-converter", title: "Image Converter", description: "Convert between WEBP, PNG, JPG, GIF, PDF, SVG, HEIC, ICO, TIFF, BMP, TGA, AVIF, and EPS.", icon: ArrowLeftRight, path: "/tools/image/convert", isPopular: true, keywords: ["heic", "svg", "pdf", "favicon", "ico", "avif", "webp", "tiff"] },
  { id: "remove-bg", title: "Remove Background", description: "AI-powered background removal running locally in your browser.", icon: Image, path: "/tools/image/remove-bg", isPopular: true, keywords: ["bg", "transparent", "cutout"] },
  { id: "upscale", title: "Image Upscaler", description: "Enhance resolution by 2x or 4x using actual AI super-resolution.", icon: Maximize2, path: "/tools/image/upscale", isPopular: true, keywords: ["enlarge", "resolution", "4k"] },
  { id: "image-compressor", title: "Image Compressor", description: "Compress images rapidly without losing quality.", icon: Minimize2, path: "/tools/image/compress", isPopular: true, keywords: ["shrink", "size", "kb"] },
  { id: "crop-resize", title: "Crop & Resize", description: "Easily crop and resize free-hand or to specific dimensions.", icon: Crop, path: "/tools/image/crop", isPopular: true },
  { id: "watermark-studio", title: "Watermark Studio", description: "Comprehensive tool to add protection or remove unwanted watermarks.", icon: Stamp, path: "/tools/image/watermark-studio", keywords: ["watermark", "remove", "add", "copyright"] },
  { id: "code-generator", title: "Code Generator", description: "Generate high-res QR codes and standard barcodes for any data.", icon: QrCode, path: "/tools/image/code-generator", keywords: ["qr", "barcode", "link", "matrix"] },
  { id: "ocr", title: "OCR — Image to Text", description: "Extract text from images using AI-powered OCR.", icon: Languages, path: "/tools/image/ocr" },
  { id: "social-resizer", title: "Social Media Resizer", description: "One-click resize for Instagram, Twitter, and LinkedIn.", icon: Smartphone, path: "/tools/image/social-resizer", keywords: ["resize", "crop", "ig", "twitter"] },
  { id: "image-effects", title: "Image Effects", description: "Apply filters, adjust brightness, contrast, and more.", icon: Layers, path: "/tools/image/effects" },

  { id: "gif-maker", title: "GIF Maker", description: "Combine images into a perfectly timed animated GIF.", icon: Images, path: "/tools/image/gif-maker", keywords: ["animation", "loop", "frames"] },
  { id: "pixel-art", title: "Pixel Art Converter", description: "Downscale any image into chunky retro pixel art.", icon: Binary, path: "/tools/image/pixel-art", keywords: ["retro", "8bit", "game"] },
  { id: "noise-grain", title: "Noise & Grain", description: "Add film grain, noise, or vintage textures to any photo.", icon: Sparkles, path: "/tools/image/noise", keywords: ["texture", "film", "retro"] },
  { id: "image-to-sketch", title: "Image to Sketch", description: "Turn any photo into a pencil-sketch style illustration.", icon: Pencil, path: "/tools/image/sketch", keywords: ["draw", "pencil", "art"] },
  { id: "sprite-slicer", title: "Sprite Sheet Slicer", description: "Cut a sprite grid into individual files in a zip.", icon: Grid, path: "/tools/image/sprite-slicer" },
  { id: "before-after", title: "Before & After Slider", description: "Create an interactive slider to compare two images side-by-side.", icon: SplitSquareHorizontal, path: "/tools/image/slider" },
  { id: "palette", title: "Color Palette", description: "Extract design palettes from any photograph.", icon: Pipette, path: "/tools/image/palette" },
  { id: "censor", title: "Smart Censor", description: "Pixelate sensitive information and faces.", icon: ShieldAlert, path: "/tools/image/censor" },
  { id: "image-privacy", title: "Image Privacy", description: "Sanitize EXIF metadata and strip ICC color profiles for maximum security.", icon: ShieldCheck, path: "/tools/image/privacy", keywords: ["metadata", "privacy", "gps", "icc", "srgb", "viewer", "read", "exif"] },
  { id: "ascii", title: "ASCII Art Converter", description: "Turn any image into a text-based ASCII rendering.", icon: Type, path: "/tools/image/ascii" },
  { id: "meme", title: "Meme Generator", description: "Create viral memes with custom text and templates.", icon: MessageSquare, path: "/tools/image/meme" },
  { id: "color-blind", title: "Color Blind Simulator", description: "Simulate exact visual perception using direct pixel matrices.", icon: EyeOff, path: "/tools/image/color-blind", keywords: ["accessibility", "protanopia", "sight"] },
  { id: "collage-maker", title: "Collage Maker", description: "Arrange multiple images into grids or masonry layouts.", icon: Layout, path: "/tools/image/collage", keywords: ["grid", "masonry", "layout"] },
]


export const PDF_TOOLS: Tool[] = [
  { id: "merge-pdf", title: "Merge PDFs", description: "Combine multiple PDFs into a single file easily.", icon: Layers, path: "/tools/pdf/merge", isPopular: true, keywords: ["combine", "join", "add"] },
  { id: "split-pdf", title: "Split PDF", description: "Extract pages from your PDF into separate files.", icon: SplitSquareHorizontal, path: "/tools/pdf/split", isPopular: true },
  { id: "pdf-editor", title: "PDF Editor", description: "Annotate, draw, and modify PDF content directly.", icon: FileEdit, path: "/tools/pdf/editor", isPopular: true, keywords: ["edit", "draw", "modify"] },
  { id: "compress-pdf", title: "Compress PDF", description: "Reduce file size while optimizing for quality.", icon: Minimize2, path: "/tools/pdf/compress", isPopular: true },
  { id: "images-to-pdf", title: "Images to PDF", description: "Combine multiple images into a professional PDF.", icon: FileImage, path: "/tools/pdf/images-to-pdf", isPopular: true },
  { id: "pdf-exporter", title: "PDF Exporter", description: "Export PDFs into ZIP images, raw text, or editable Word documents.", icon: FileSearch, path: "/tools/pdf/exporter", keywords: ["doc", "docx", "text", "page", "images"] },
  { id: "pdf-password", title: "PDF Passwords", description: "Add or remove password protection from PDFs.", icon: Lock, path: "/tools/pdf/password", isPopular: true },
  { id: "reorder-pdf", title: "Reorder PDF", description: "Drag and drop to rearrange pages in your PDF.", icon: ListOrdered, path: "/tools/pdf/reorder" },
  { id: "pdf-watermark", title: "PDF Watermark", description: "Stamp text or logos across all PDF pages.", icon: Stamp, path: "/tools/pdf/watermark" },
  { id: "rotate-pdf", title: "Rotate PDF Pages", description: "Rotate individual or all pages 90°, 180°, or 270°.", icon: RotateCw, path: "/tools/pdf/rotate" },
  { id: "flatten-pdf", title: "Flatten PDF", description: "Convert interactive form fields into permanent page content.", icon: FileCheck, path: "/tools/pdf/flatten" },
  { id: "crop-pdf", title: "Crop PDF Pages", description: "Adjust page margins to remove whitespace or crop content.", icon: Crop, path: "/tools/pdf/crop" },
  { id: "remove-blank-pages", title: "Remove Blank Pages", description: "Auto-detect and strip empty/white pages from a PDF.", icon: FileMinus, path: "/tools/pdf/remove-blank" },
  { id: "n-up", title: "N-up Imposition", description: "Print 2 or 4 pages per sheet to save paper.", icon: Layout, path: "/tools/pdf/n-up" },
  { id: "pdf-fonts", title: "PDF Font Extractor", description: "Extract subsets and map embedded binary typography layers.", icon: Type, path: "/tools/pdf/fonts", keywords: ["ttf", "typography", "embedded"] },
]

export const AI_TOOLS: Tool[] = [
  { id: "ai-screenshot-to-code", title: "Screenshot to Code", description: "UI screenshot → HTML + Tailwind via Claude Vision.", icon: Monitor, path: "/tools/ai/screenshot-to-code", isPopular: true, keywords: ["ui", "frontend", "dev"] },
  { id: "ai-screenshot-to-game-code", title: "Screenshot to Game Code", description: "Convert code screenshots to Godot, Unity, or Unreal code using Gemini or OCR fallback.", icon: Code2, path: "/tools/ai/screenshot-to-game-code", isPopular: true, keywords: ["godot", "unity", "unreal", "ocr", "gemini"] },
  { id: "ai-summarizer", title: "AI PDF Summarizer", description: "Extract and summarize PDF content using Claude.", icon: Sigma, path: "/tools/ai/summarizer", isPopular: true, keywords: ["tl;dr", "reading", "study"] },
  { id: "ai-resume-reviewer", title: "AI Resume Reviewer", description: "Elite recruiter JSON evaluations and visual scorecards.", icon: Award, path: "/tools/ai/resume", isPopular: true, keywords: ["job", "audit", "cv"] },
  { id: "ai-bg-replacer", title: "AI Background Replacer", description: "Remove BG and describe a new scene to Claude.", icon: ImagePlus, path: "/tools/ai/bg-replacer", keywords: ["generative", "creative", "edit"] },
  { id: "ai-alt-text", title: "AI Alt-Text Studio", description: "Generate accessibility alt text for images (Single or Batch).", icon: BrainCircuit, path: "/tools/ai/alt-text", keywords: ["seo", "accessibility", "description", "bulk", "vision"] },
  { id: "caption-generator", title: "Caption Generator", description: "Generate contextual social captions securely.", icon: MessageSquare, path: "/tools/ai/caption", keywords: ["social", "instagram", "post"] },
  { id: "vision-font-detector", title: "Font Matcher (Vision)", description: "Heuristically determine typography via image layers.", icon: Type, path: "/tools/ai/font-match", keywords: ["font", "type", "scan"] },
  { id: "explain-ui", title: "Explain UI", description: "Deconstruct interface screenshots into hierarchy trees.", icon: Monitor, path: "/tools/ai/explain-ui", keywords: ["design", "ux", "layout"] },
  { id: "mock-api-generator", title: "Mock JSON Generator", description: "Synthesize strict deterministic schema arrays seamlessly.", icon: Database, path: "/tools/ai/mock-api", keywords: ["dummy", "data", "scaffold"] },
  { id: "ai-providers", title: "AI Keys", description: "Manage Gemini, Anthropic, OpenAI, and Groq keys in one place.", icon: KeyRound, path: "/tools/ai/providers", keywords: ["api", "keys", "providers"] },
]

export const DEV_TOOLS: Tool[] = [

  { id: "code-formatter", title: "Code Formatter Studio", description: "Consolidated prettifier and minifier for JSON, HTML, SQL, and XML.", icon: Code, path: "/tools/dev/formatter", isPopular: true, keywords: ["pretty", "minify", "json", "html", "sql", "xml"] },
  { id: "color-picker", title: "Color Converter", description: "Pick any color, convert between HEX, RGB, HSL, CMYK.", icon: Palette, path: "/tools/dev/color", isPopular: true },
  { id: "base64-studio", title: "Base64 Studio", description: "Encode/Decode text, images, or files to base64 strings.", icon: Code2, path: "/tools/dev/base64-studio", isPopular: true, keywords: ["string", "encode", "embed"] },
  { id: "http-builder", title: "HTTP Request Builder", description: "Compose and test API requests with custom headers, body, and methods.", icon: Globe2, path: "/tools/dev/http-builder", isPopular: true, keywords: ["api", "rest", "postman", "curl"] },
  { id: "url-encoder", title: "URL Encoder / Decoder", description: "Encode or decode query strings and full URLs safely.", icon: Link2, path: "/tools/dev/url", isPopular: true },
  { id: "regex-tester", title: "Regex Tester", description: "Live regex matching with highlighting, group capture, and flags.", icon: Terminal, path: "/tools/dev/regex", keywords: ["test", "match", "regular"] },
  { id: "uuid-hash", title: "UUID & Hash Generator", description: "Generate UUIDs, MD5, and SHA-256 hashes.", icon: Key, path: "/tools/dev/uuid-hash" },
  { id: "css-gradient", title: "CSS Gradient Builder", description: "Build linear or radial gradients visually.", icon: Zap, path: "/tools/dev/gradient" },
  { id: "timestamp-converter", title: "Timestamp Converter", description: "Unix epoch to human-readable date and back with timezones.", icon: Clock, path: "/tools/dev/timestamp", keywords: ["time", "unix", "date"] },
  { id: "jwt-decoder", title: "JWT Decoder", description: "Decode JSON Web Tokens visually locally without validation.", icon: ShieldCheck, path: "/tools/dev/jwt", keywords: ["token", "auth", "base64"] },
  { id: "cron-builder", title: "CRON Expression Tester", description: "Validate CRON strings and preview immediate run times.", icon: Calendar, path: "/tools/dev/cron", keywords: ["schedule", "time", "job"] },
  { id: "css-unit-converter", title: "CSS Unit Converter", description: "Convert px to rem, em, vw, vh instantly based on rules.", icon: Scissors, path: "/tools/dev/css-units", keywords: ["size", "font", "rem"] },
  { id: "env-editor", title: "ENV File Editor", description: "Upload and edit .env files in a clean table UI locally.", icon: FileCode, path: "/tools/dev/env", keywords: ["config", "environment", "dotenv"] },
  { id: "json-to-csv", title: "JSON to CSV / Excel", description: "Convert JSON arrays or objects into CSV or spreadsheet formats.", icon: FileSpreadsheet, path: "/tools/dev/json-to-csv", keywords: ["export", "excel", "table"] },
]

export const VIDEO_TOOLS: Tool[] = [
  { id: "video-compressor", title: "Video Compressor", description: "Compress MP4/WebM files locally with FFMPEG.", icon: Minimize2, path: "/tools/video/compress", isPopular: true },
  { id: "video-trimmer", title: "Video Trimmer", description: "Slice and exact clip segments via native stream-copying.", icon: Scissors, path: "/tools/video/trimmer", isPopular: true, keywords: ["cut", "slice", "mp4"] },
  { id: "audio-studio", title: "Audio Studio", description: "Consolidated converter, normalizer, and video-to-audio extraction.", icon: Mic, path: "/tools/video/audio-studio", isPopular: true, keywords: ["mp3", "wav", "extract", "normalize"] },
  { id: "video-to-gif", title: "Video to GIF", description: "Clip short video captures and save as GIFs.", icon: Video, path: "/tools/video/to-gif" },
  { id: "video-thumbnails", title: "Video Grid Extractor", description: "Rapidly pull high-resolution thumbnail sheets securely.", icon: ImagePlay, path: "/tools/video/thumbnails", keywords: ["grid", "frames", "snapshot"] },
  { id: "audio-waveform", title: "Audio Waveform Visualizer", description: "Visually inspect audio tracks and precision trim segments.", icon: FastForward, path: "/tools/video/waveform", keywords: ["trim", "cut", "mp3"] },
  { id: "video-speed", title: "Video Speed Changer", description: "Speed up or slow down video (0.25x-4x) with pitch correction.", icon: FastForward, path: "/tools/video/speed", keywords: ["slowmo", "fast", "ffmpeg"] },
]

export const TEXT_TOOLS: Tool[] = [
  { id: "password-generator", title: "Password Generator", description: "Generate strong passwords with length and symbol configs.", icon: KeyRound, path: "/tools/text/password", isPopular: true, keywords: ["secure", "strong", "random"] },
  { id: "markdown-preview", title: "Markdown Preview", description: "Paste markdown, get a live rendered preview.", icon: Eye, path: "/tools/text/md-preview", isPopular: true },
  { id: "text-diff", title: "Text Diff Checker", description: "Compare two texts and see additions/removals.", icon: Diff, path: "/tools/text/diff", isPopular: true },
  { id: "text-analyser", title: "Text Analyser", description: "Word count, reading time, and top words analysis.", icon: Search, path: "/tools/text/analyser" },
  { id: "csv-json", title: "CSV ↔ JSON Converter", description: "Convert spreadsheet data to JSON and back.", icon: ArrowLeftRight, path: "/tools/text/csv-json" },
  { id: "string-case", title: "String Case Converter", description: "Convert between camelCase, snake_case, PascalCase simultaneously.", icon: Type, path: "/tools/text/string-case" },
  { id: "lorem-ipsum", title: "Lorem Ipsum Generator", description: "Customizable placeholder text generator natively.", icon: AlignLeft, path: "/tools/text/lorem" },
  { id: "word-frequency", title: "Word Frequency Counter", description: "Analyze text and visualize word percentages dynamically.", icon: BarChart3, path: "/tools/text/word-frequency" },
  { id: "number-base", title: "Number Base Converter", description: "Live conversions between decimal, binary, hex, and octal.", icon: Hash, path: "/tools/text/number-base" },
  { id: "fake-data", title: "Fake Data Generator", description: "Generate realistic datasets: names, emails, addresses, IPs.", icon: Database, path: "/tools/text/fake-data", keywords: ["mock", "dummy", "csv", "json"] },
  { id: "toml-json", title: "TOML ↔ JSON", description: "Bidirectional conversion between TOML and JSON formats.", icon: Repeat, path: "/tools/text/toml-json", keywords: ["config", "cargo", "rust"] },
  { id: "unicode-explorer", title: "Unicode Explorer", description: "Inspect code points, categories, and bytes for any character.", icon: Languages, path: "/tools/text/unicode", keywords: ["utf8", "entity", "hex"] },
  { id: "name-formatter", title: "Name Case Formatter", description: "Bulk-fix name casing (JOHN DOE → John Doe) with prefix support.", icon: Type, path: "/tools/text/name-case", keywords: ["cleanup", "list", "format"] },
  { id: "table-to-md", title: "Table to Markdown / HTML", description: "Convert spreadsheet selections or CSV into Markdown or HTML tables.", icon: Table, path: "/tools/text/table-to-md", keywords: ["convert", "excel", "spreadsheet"] },
  { id: "readme-viewer", title: "README Previewer", description: "Preview GitHub READMEs with templates, badges, and live rendering.", icon: BookOpen, path: "/tools/text/readme", isPopular: true, keywords: ["github", "markdown", "badge", "shield", "template"] },
]

export const BROWSER_TOOLS: Tool[] = [
  { id: "dns-lookup", title: "DNS Lookup", description: "Check A, AAAA, MX, TXT records via Cloudflare DNS.", icon: Globe2, path: "/tools/browser/dns", keywords: ["records", "domain", "dig"] },
  { id: "ip-info", title: "IP Lookup", description: "Get geolocation, ASN, and ISP info for any IP address.", icon: MapPin, path: "/tools/browser/ip", keywords: ["geo", "location", "whois"] },
  { id: "ssl-checker", title: "SSL Checker", description: "Verify SSL certificates, expiry dates, and issuers.", icon: Shield, path: "/tools/browser/ssl", keywords: ["cert", "https", "security"] },
  { id: "ua-parser", title: "User Agent Parser", description: "Break down any UA string into browser, OS, and device.", icon: MonitorSmartphone, path: "/tools/browser/ua", keywords: ["header", "detect", "client"] },
  { id: "mime-types", title: "MIME Type Lookup", description: "Find mappings between file extensions and MIME types.", icon: FileSearch, path: "/tools/browser/mime", keywords: ["content-type", "extension", "mapping"] },
]

export const SECURITY_TOOLS: Tool[] = [
  { id: "totp-gen", title: "TOTP Generator", description: "Generate 2FA codes locally from a secret key.", icon: KeyRound, path: "/tools/security/totp", keywords: ["2fa", "mfa", "authenticator"] },
  { id: "bcrypt-hasher", title: "Bcrypt Hasher", description: "Hash and verify passwords using the bcrypt algorithm.", icon: Fingerprint, path: "/tools/security/bcrypt", keywords: ["auth", "crypto", "salt"] },
  { id: "rsa-gen", title: "RSA Key Generator", description: "Generate RSA public/private key pairs in PEM format.", icon: KeySquare, path: "/tools/security/rsa", keywords: ["pem", "openssl", "asymmetric"] },
  { id: "checksum-verify", title: "Checksum Verifier", description: "Verify file integrity via MD5, SHA-1, or SHA-256.", icon: FileCheck, path: "/tools/security/checksum", keywords: ["hash", "integrity", "verify"] },
]

export const MATH_TOOLS: Tool[] = [
  { id: "matrix-calc", title: "Matrix Calculator", description: "Add, multiply, and find determinants for 2x2 to 5x5 matrices.", icon: Calculator, path: "/tools/math/matrix", keywords: ["linear", "algebra", "transpose"] },
  { id: "unit-converter", title: "Unit Converter", description: "Convert length, weight, temperature, and more.", icon: ArrowLeftRight, path: "/tools/math/units", keywords: ["measure", "imperial", "metric"] },
  { id: "scientific-calc", title: "Scientific Calculator", description: "Advanced math functions including trig and logs.", icon: Calculator, path: "/tools/math/scientific", keywords: ["trig", "log", "math"] },
  { id: "percentage-calc", title: "Percentage Calculator", description: "Calculate % change, % of, and common ratios.", icon: Percent, path: "/tools/math/percentage" },
]

export const FINANCE_TOOLS: Tool[] = [
  { id: "finance-studio", title: "Finance Studio", description: "Consolidated loan EMI, mortgage, and investment SIP calculators.", icon: Calculator, path: "/tools/finance/studio", isPopular: true, keywords: ["mortgage", "bank", "sip", "investment"] },
  { id: "currency-formatter", title: "Currency Formatter", description: "Format numbers into any world currency locale correctly.", icon: Wallet, path: "/tools/finance/currency", keywords: ["intl", "money", "lakhs"] },
  { id: "gst-calc", title: "GST Calculator", description: "Compute tax-inclusive and tax-exclusive prices.", icon: Receipt, path: "/tools/finance/gst", keywords: ["vat", "tax", "india"] },
]

export const CATEGORIES = [
  { id: "ai", title: "AI Utilities", tools: AI_TOOLS, color: "emerald-500" },
  { id: "image", title: "Image Tools", tools: IMAGE_TOOLS, color: "primary" },
  { id: "pdf", title: "PDF Tools", tools: PDF_TOOLS, color: "accent" },
  { id: "dev", title: "Developer Tools", tools: DEV_TOOLS, color: "blue-500" },
  { id: "video", title: "Video & Audio", tools: VIDEO_TOOLS, color: "purple-500" },
  { id: "text", title: "Text & Data", tools: TEXT_TOOLS, color: "green-500" },
  { id: "browser", title: "Browser & Network", tools: BROWSER_TOOLS, color: "orange-500" },
  { id: "security", title: "Security & Crypto", tools: SECURITY_TOOLS, color: "red-500" },
  { id: "math", title: "Math & Science", tools: MATH_TOOLS, color: "yellow-500" },
  { id: "finance", title: "Finance Tools", tools: FINANCE_TOOLS, color: "cyan-500" },
]

export const ALL_TOOLS = [
  ...AI_TOOLS, ...IMAGE_TOOLS, ...PDF_TOOLS, 
  ...DEV_TOOLS, ...VIDEO_TOOLS, ...TEXT_TOOLS,
  ...BROWSER_TOOLS, ...SECURITY_TOOLS, ...MATH_TOOLS, ...FINANCE_TOOLS
]
