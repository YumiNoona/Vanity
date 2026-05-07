import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Group heavy node_modules into stable vendor chunks
          if (id.includes("node_modules")) {
            if (id.includes("@ffmpeg")) return "vendor-ffmpeg"
            if (id.includes("pdfjs-dist")) return "vendor-pdfjs"
            if (id.includes("pdf-lib") || id.includes("jspdf")) return "vendor-pdf-lib"
            if (id.includes("@tensorflow") || id.includes("upscaler")) return "vendor-ai-engine"
            if (id.includes("framer-motion")) return "vendor-framer"
            if (id.includes("lucide-react")) return "vendor-ui-core"
            if (id.includes("react-colorful") || id.includes("qrcode") || id.includes("jsbarcode") || id.includes("canvas-confetti")) return "vendor-ui-utils"
            return "vendor"
          }
          // Group tool components by domain to reduce fragmentation
          if (id.includes("src/components/tools/")) {
            if (id.includes("/pdf/")) return "pdf-tools"
            if (id.includes("/video/")) return "video-tools"
            if (id.includes("/ai/")) return "ai-tools"
            if (id.includes("/image/")) return "image-tools"
            if (id.includes("/text/")) return "text-tools"
            if (id.includes("/dev/")) return "dev-tools"
          }
        },
      },
    },
  },
})
