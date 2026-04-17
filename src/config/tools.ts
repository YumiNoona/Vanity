import { Image, Layers, Crop, CheckCircle, FileText, SplitSquareHorizontal, Minimize2, Lock, ListTodo, Images } from "lucide-react"

export const IMAGE_TOOLS = [
  { id: "remove-bg", title: "Remove Background", description: "AI-powered background removal running locally in your browser.", icon: Image, path: "/tools/image/remove-bg", isPopular: true },
  { id: "image-effects", title: "Image Effects", description: "Apply filters, adjust brightness, contrast, and more.", icon: Layers, path: "/tools/image/effects" },
  { id: "format-converter", title: "Format Converter", description: "Convert between PNG, JPG, WEBP, and more formats.", icon: FileText, path: "/tools/image/convert" },
  { id: "image-compressor", title: "Image Compressor", description: "Compress images rapidly without losing quality.", icon: Minimize2, path: "/tools/image/compress", isPopular: true },
  { id: "crop-resize", title: "Crop & Resize", description: "Easily crop and resize free-hand or to specific dimensions.", icon: Crop, path: "/tools/image/crop" },
  { id: "add-watermark", title: "Add Watermark", description: "Protect your images with text or image watermarks.", icon: CheckCircle, path: "/tools/image/watermark" },
]

export const PDF_TOOLS = [
  { id: "merge-pdf", title: "Merge PDFs", description: "Combine multiple PDFs into a single file easily.", icon: Layers, path: "/tools/pdf/merge", isPopular: true },
  { id: "split-pdf", title: "Split PDF", description: "Extract pages from your PDF or save each page as a separate PDF.", icon: SplitSquareHorizontal, path: "/tools/pdf/split" },
  { id: "compress-pdf", title: "Compress PDF", description: "Reduce file size while optimizing for maximal PDF quality.", icon: Minimize2, path: "/tools/pdf/compress" },
  { id: "pdf-password", title: "PDF Passwords", description: "Add or remove password protection from PDFs.", icon: Lock, path: "/tools/pdf/password" },
  { id: "pdf-to-images", title: "PDF to Images", description: "Convert each page of your PDF into high-quality images.", icon: Images, path: "/tools/pdf/to-images" },
]

export const ALL_TOOLS = [...IMAGE_TOOLS, ...PDF_TOOLS]
