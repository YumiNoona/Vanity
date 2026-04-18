import { Image, Layers, Crop, CheckCircle, FileText, SplitSquareHorizontal, Minimize2, Lock, ListTodo, Images, Eraser, FileCode, Pipette, ShieldAlert, ShieldCheck, QrCode, Barcode, Sparkles, ListOrdered, Stamp } from "lucide-react"

export const IMAGE_TOOLS = [
  { id: "remove-bg", title: "Remove Background", description: "AI-powered background removal running locally in your browser.", icon: Image, path: "/tools/image/remove-bg", isPopular: true },
  { id: "image-effects", title: "Image Effects", description: "Apply filters, adjust brightness, contrast, and more.", icon: Layers, path: "/tools/image/effects" },
  { id: "format-converter", title: "Format Converter", description: "Convert between PNG, JPG, WEBP, and more formats.", icon: FileText, path: "/tools/image/convert" },
  { id: "image-compressor", title: "Image Compressor", description: "Compress images rapidly without losing quality.", icon: Minimize2, path: "/tools/image/compress", isPopular: true },
  { id: "crop-resize", title: "Crop & Resize", description: "Easily crop and resize free-hand or to specific dimensions.", icon: Crop, path: "/tools/image/crop" },
  { id: "add-watermark", title: "Add Watermark", description: "Protect your images with text or image watermarks.", icon: CheckCircle, path: "/tools/image/watermark" },
  { id: "remove-watermark", title: "Watermark Remover", description: "Smart AI lasso tool to remove unwanted watermarks.", icon: Eraser, path: "/tools/image/remove-watermark" },
  { id: "to-base64", title: "Image to Base64", description: "Convert images to base64 strings for code embedding.", icon: FileCode, path: "/tools/image/to-base64" },
  { id: "palette", title: "Color Palette", description: "Extract design palettes from any photograph.", icon: Pipette, path: "/tools/image/palette" },
  { id: "censor", title: "Smart Censor", description: "Pixelate sensitive information and faces.", icon: ShieldAlert, path: "/tools/image/censor" },
  { id: "exif-sanitizer", title: "EXIF Sanitizer", description: "Remove GPS and device metadata for maximum privacy.", icon: ShieldCheck, path: "/tools/image/exif-sanitizer" },
  { id: "qr", title: "QR Generator", description: "Create high-resolution QR codes locally.", icon: QrCode, path: "/tools/image/qr" },
  { id: "barcode", title: "Barcode Generator", description: "Standard barcodes for logistics and inventory.", icon: Barcode, path: "/tools/image/barcode" },
  { id: "meme", title: "Meme Generator", description: "Create viral memes with custom text and templates.", icon: Sparkles, path: "/tools/image/meme" },
  { id: "upscale", title: "AI Image Upscale", description: "Enhance resolution by 2x or 4x with sharp edges.", icon: Maximize2, path: "/tools/image/upscale" },
]

export const PDF_TOOLS = [
  { id: "merge-pdf", title: "Merge PDFs", description: "Combine multiple PDFs into a single file easily.", icon: Layers, path: "/tools/pdf/merge", isPopular: true },
  { id: "split-pdf", title: "Split PDF", description: "Extract pages from your PDF or save each page as a separate PDF.", icon: SplitSquareHorizontal, path: "/tools/pdf/split" },
  { id: "compress-pdf", title: "Compress PDF", description: "Reduce file size while optimizing for maximal PDF quality.", icon: Minimize2, path: "/tools/pdf/compress" },
  { id: "pdf-password", title: "PDF Passwords", description: "Add or remove password protection from PDFs.", icon: Lock, path: "/tools/pdf/password" },
  { id: "pdf-to-images", title: "PDF to Images", description: "Convert each page of your PDF into high-quality images.", icon: Images, path: "/tools/pdf/to-images" },
  { id: "reorder-pdf", title: "Reorder PDF", description: "Drag and drop to rearrange pages in your PDF.", icon: ListOrdered, path: "/tools/pdf/reorder" },
  { id: "watermark-pdf", title: "PDF Watermark", description: "Add text stamps to all pages of your PDF.", icon: Stamp, path: "/tools/pdf/watermark" },
]

export const ALL_TOOLS = [...IMAGE_TOOLS, ...PDF_TOOLS]
