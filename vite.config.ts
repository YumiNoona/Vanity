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
    proxy: {
      "/api/proxy": {
        target: "http://localhost:5173",
        bypass: (req, res) => {
          const proxyUrl = new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("url")
          if (!proxyUrl || !res) {
            if (res) {
              res.statusCode = 400
              res.end("Missing url parameter")
            }
            return
          }
          
          // Use Node's built-in https for maximum compatibility if global fetch is missing
          const protocol = proxyUrl.startsWith('https') ? require('https') : require('http');
          
          const proxyReq = protocol.request(proxyUrl, {
            method: req.method,
            headers: {
              "User-Agent": "Mozilla/5.0 (Vanity Tool Proxy)",
              "Accept": "*/*"
            }
          }, (proxyRes: any) => {
            res.writeHead(proxyRes.statusCode || 200, {
              ...proxyRes.headers,
              "Access-Control-Allow-Origin": "*"
            });
            proxyRes.pipe(res);
          });

          proxyReq.on('error', (err: any) => {
            res.statusCode = 500
            res.end(err.message)
          });

          req.pipe(proxyReq);
          return
        }
      },
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
