<h1 align="center">✦ Vanity</h1>
<p align="center"><strong>The All-In-One Private Image & PDF Utility Suite — 100% Free</strong></p>

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
  <img src="https://img.shields.io/badge/AI-BYOK%20(Anthropic)-orange?style=flat-square" alt="AI BYOK" />
</p>

---

## 📖 About

**Vanity** is a modern, premium-grade web application that replaces clunky desktop software and subscription-heavy utility sites. It bundles dozens of powerful Image, PDF, and AI tools into a completely **client-side** application.

> **🔒 Privacy by Design** — Vanity leverages modern Web APIs including `Canvas`, `WebAssembly`, `Fabric.js`, and browser-native file streams to process all user data locally. **Your files never leave your machine.**

### 🏗️ Architecture Highlights

- **Hybrid Processing** — 95% client-side; high-security PDF encryption via a local qpdf-powered micro-server
- **Industrial Dimensions Guard** — Mobile-aware (10MP) vs Desktop (20MP) scaling protects against OOM crashes
- **Time-Budgeted Yielding** — 10ms `maybeYield` loops maintain 60fps during heavy pixel manipulations
- **Lazy-Loaded Modules** — Heavy libraries (`pdf-lib`, `ffmpeg.wasm`) load on-demand with idle pre-warming
- **Bulletproof Memory Hygiene** — Tracked Object URL lifecycles and recursive canvas disposal (`safeRevoke`)

---

## ✨ Features

### 🖼️ Image Tools
| Tool | Description |
|---|---|
| **Social Media Resizer** | One-click resize for IG, TikTok, YouTube with safe-area overlays and aspect locking |
| **GIF Maker** | Combine images into animated GIFs with frame delay control and aggregate pixel guards |
| **Sprite Sheet Slicer** | Canvas-based grid slicer with pixel-art modes and JSZip chunked archiving |
| **Remove Background (AI)** | ML-powered background removal running locally via WebAssembly (`@imgly/background-removal`) |
| **Asset Compressor** | Resize and compress to WebP/JPEG using lossy or lossless degradation |
| **Format Converter** | Convert between WebP, PNG, JPEG, and GIF instantly |
| **Meme Generator** | Fabric.js canvas editor with draggable text layers and layer deletion |
| **Before/After Slider** | Interactive comparison deck with smooth touch-masking |

### 📄 PDF Tools
| Tool | Description |
|---|---|
| **Merge & Split** | Drag, arrange, and seamlessly combine or extract PDF files |
| **PDF to Images** | Convert each page to high-quality PNG with per-page progress |
| **Password Manager** | Add **AES-256** encryption or remove passwords via local `qpdf` backend |
| **Remove Blank Pages** | Smart pixel-density analysis to auto-sanitize documents |

### 🎬 Video & Audio Tools (FFMPEG.wasm)
| Tool | Description |
|---|---|
| **Video Compressor** | High-performance MP4/WebM compression with CRF control |
| **Audio Converter** | Transcode between MP3, WAV, OGG, and M4A losslessly |
| **Video to MP3** | One-click audio extraction from video sources |

### 🤖 AI Utilities (Anthropic BYOK)
| Tool | Description |
|---|---|
| **Screenshot to Code** | Convert UI mockups into clean **Tailwind CSS + HTML** code |
| **AI PDF Summariser** | Intelligent recursive summarisation for large documents |
| **AI Alt-Text Writer** | Accurate accessibility descriptions from any image |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | React 19, TypeScript 6 | Type-safe component architecture |
| **Build** | Vite 8 | Sub-second HMR, optimized code splitting |
| **Canvas Engine** | Fabric.js 7 | Rich interactive canvas editing & composition |
| **Video Engine** | `ffmpeg.wasm` v0.12 | Multi-threaded browser video processing |
| **GIF Engine** | `gifshot` | High-performance GIF encoding & palette optimization |
| **Archiver** | `jszip` | Chunked client-side ZIP generation |
| **Icons** | Lucide React | Consistent icon system across all tools |
| **Monetization** | None | Donor-supported model |

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
│   │   └── usePremium.ts            # Legacy state (all features unlocked)
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
- **Anthropic API Key** (Required for AI Tools)

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

## 💖 Support the Project

Vanity is and will always be **100% free** and open. We don't show ads, we don't track you, and we don't sell your data. To keep this project alive and cover the costs of hosting and AI processing, we rely entirely on community donations.

If you find these tools useful, please consider supporting us:

- **UPI ID**: `rushikeshingale2001@okicici`
- **Goal**: Keep Vanity forever free for everyone.

Every donation, no matter how small, makes a huge difference!

---

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
