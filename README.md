<p align="center">
  <img src="https://img.shields.io/badge/Vanity-Image%20%26%20PDF%20Suite-F59E0B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMNiA3IDEyIDEyIDE4IDd6Ii8+PC9zdmc+" alt="Vanity" />
</p>

<h1 align="center">✦ Vanity</h1>
<p align="center"><strong>The All-In-One Private Image & PDF Utility Suite</strong></p>

<p align="center">
  <a href="https://vanity.venusapp.in"><img src="https://img.shields.io/badge/🌐_Live_Site-vanity.venusapp.in-F59E0B?style=for-the-badge" alt="Live Site" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Fabric.js-7.2-orange?style=flat-square" alt="Fabric.js" />
  <img src="https://img.shields.io/badge/pdf--lib-1.17-red?style=flat-square" alt="pdf-lib" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/Client--Side-100%25-blueviolet?style=flat-square" alt="Client-Side" />
  <img src="https://img.shields.io/badge/Privacy-Zero%20Upload-success?style=flat-square" alt="Privacy" />
  <img src="https://img.shields.io/badge/Bundle-Code%20Split-informational?style=flat-square" alt="Code Split" />
</p>

---

## 📖 About

**Vanity** is a modern, premium-grade web application that replaces clunky desktop software and subscription-heavy utility sites. It bundles dozens of powerful Image, PDF, and AI tools into a completely **client-side** application.

> **🔒 Privacy by Design** — Vanity leverages modern Web APIs including `Canvas`, `WebAssembly`, `Fabric.js`, and browser-native file streams to process all user data locally. **Your files never leave your machine.**

### 🏗️ Architecture Highlights

- **Hybrid Processing** — 95% client-side; high-security PDF encryption via a local qpdf-powered micro-server
- **Job-Tracked Processing** — Race-condition-safe async pipeline with automatic cancellation
- **Time-Budgeted Yielding** — 16ms yield loops maintain 60fps during heavy pixel operations
- **Lazy-Loaded Modules** — Heavy libraries (`pdf-lib`, `pdfjs-dist`) load on-demand with idle pre-warming
- **GPU Memory Management** — Aggressive canvas release (0×0 reset) prevents mobile browser crashes
- **Throttled UI Feedback** — Progress updates capped at 100ms intervals to prevent React re-render spam

---

## ✨ Features

### 🖼️ Image Tools
| Tool | Description |
|---|---|
| **Remove Background (AI)** | ML-powered background removal running locally via WebAssembly (`@imgly/background-removal`) |
| **Image Effects** | Native Canvas filters — Brightness, Contrast, Saturation, Sepia, Grayscale, Blur |
| **Asset Compressor** | Resize and compress to WebP/JPEG using lossy or lossless degradation |
| **Crop & Resize** | Interactive crop region with real-time preview and full-resolution export |
| **Format Converter** | Convert between WebP, PNG, JPEG, and GIF instantly |
| **AI Upscaler** | 2× / 4× super-resolution upscaling with simulated deep refinement |
| **Watermark Remover** | Brush-based in-painting with yielded pixel reconstruction |
| **Meme Generator** | Fabric.js canvas editor with draggable text layers and layer deletion |
| **Image Watermark** | Overlay text or image watermarks with opacity and positioning control |

### 📄 PDF Tools
| Tool | Description |
|---|---|
| **Merge PDFs** | Drag, arrange, and seamlessly combine multiple PDF files |
| **Split PDFs** | Extract page ranges into new documents or individual downloads |
| **PDF to Images** | Convert each page to high-quality PNG with per-page progress |
| **PDF Compression** | Client-side metadata stripping to reduce file sizes |
| **Password Manager** | Add **AES-256** encryption or remove passwords via local `qpdf` backend |
| **PDF Watermark** | Stamp text across all pages of a PDF document |
| **Reorder Pages** | Drag-and-drop page reordering with live preview |

### 🧰 Utility Tools
| Tool | Description |
|---|---|
| **QR Code Generator** | Generate QR codes from any text or URL |
| **Barcode Generator** | Create standard barcodes with JsBarcode |
| **OCR Text Extraction** | Extract text from images using Tesseract.js |
| **GIF Maker** | Combine multiple images into animated GIFs |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | React 19, TypeScript 6 | Type-safe component architecture |
| **Build** | Vite 8 | Sub-second HMR, optimized code splitting |
| **Styling** | Tailwind CSS 3.4, CSS Variables | Dark-mode design tokens, utility-first |
| **Components** | shadcn/ui, Radix Primitives | Accessible headless UI primitives |
| **Canvas** | Fabric.js 7 | Rich interactive canvas editing (memes, watermarks) |
| **Animations** | Framer Motion, Canvas Confetti | Staggered entrances, success celebrations |
| **PDF Engine** | `pdf-lib`, `pdfjs-dist` | Read/write/render PDF binaries |
| **AI / ML** | `@imgly/background-removal` | Client-side WASM neural network inference |
| **OCR** | `tesseract.js` | In-browser optical character recognition |
| **Icons** | Lucide React | Consistent icon system across all tools |

---

## 📂 Project Structure

```text
├── server/                          # Local PDF encryption backend
│   ├── uploads/                     # Temporary processing buffer
│   ├── server.js                    # Express + qpdf bridge
│   └── package.json                 # Backend dependencies
├── src/
│   ├── components/
│   │   ├── layout/                  # AppLayout, Navbar, Sidebar
│   │   ├── shared/                  # DropZone, AdSlot
│   │   ├── tools/
│   │   │   ├── image/               # All image tool components
│   │   │   └── pdf/                 # All PDF tool components
│   │   └── ui/                      # shadcn/ui primitives
│   ├── config/
│   │   └── tools.ts                 # Tool registry (icons, routes, metadata)
│   ├── hooks/
│   │   ├── useImageProcessor.ts     # Job-tracked processing hub
│   │   └── usePremium.ts            # Local monetization state
│   ├── lib/
│   │   ├── canvas/
│   │   │   ├── index.ts             # loadImage, drawToCanvas, exportCanvas
│   │   │   └── guards.ts            # runYieldedTask, releaseCanvas, dimension guards
│   │   └── utils.ts                 # Tailwind merge helpers
│   ├── pages/
│   │   └── Home.tsx                 # Animated tool grid
│   ├── App.tsx                      # Router setup
│   ├── index.css                    # Global dark tokens + glass effects
│   └── main.tsx                     # React DOM mount
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.app.json
├── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **qpdf** (installed and added to PATH or absolute path configured in `server/server.js`)

### Installation

```bash
git clone https://github.com/YumiNoona/Vanity.git
cd Vanity
npm install
```

#### 🌐 Frontend
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

#### 🛡️ PDF Backend (Required for Password Management)
```bash
cd server
npm install
node server.js
```
The backend serves on `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| **Background** | `#0A0A0A` | Pure dark aesthetic base |
| **Primary** | `#F59E0B` (Amber) | Interactive elements, CTAs, glows |
| **Font (Display)** | Syne | Headlines, branding, tool titles |
| **Font (Body)** | DM Sans | Paragraphs, labels, descriptions |
| **Glass Panels** | `bg-white/[0.03]` | Depth without hard borders |
| **Glow Effects** | `shadow-[0_0_20px_rgba(245,158,11,0.2)]` | Interactive element highlights |

---

## 💰 Plans

| Capability | Free | Pro |
|---|---|---|
| Max Files Per Batch | 5 | 50 |
| File Size Limit | 10 MB | 100 MB |
| Ad Experience | Active | None |
| AI Processing | Standard | Priority |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ☕ and obsessive attention to detail</sub><br/>
  <a href="https://vanity.venusapp.in"><strong>vanity.venusapp.in</strong></a>
</p>
