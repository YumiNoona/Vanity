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

- **Standardized Tool Architecture** — All 100+ tools migrated to a unified `ToolLayout` and `ToolUploadLayout` system for consistent UX and responsive design.
- **Hybrid Processing** — 95% client-side; high-security PDF encryption via a local qpdf-powered micro-server.
- **Industrial Dimensions Guard** — Mobile-aware (10MP) vs Desktop (20MP) scaling protects against OOM crashes.
- **Time-Budgeted Yielding** — 10ms `maybeYield` loops maintain 60fps during heavy pixel manipulations.
- **Bulletproof Memory Hygiene** — Tracked Object URL lifecycles via `useObjectUrl` and recursive canvas disposal.
- **Smooth Micro-Animations** — Standardized `PillToggle` and `ModeToggle` components for fluid mode transitions.

---

## ✨ Features

### 🖼️ Image Tools
| Tool | Description |
|---|---|
| **EXIF Sanitizer** | Strip GPS and device metadata locally; batch mode supported. |
| **ICC Profile Stripper** | Normalize colors to sRGB by removing embedded color profiles. |
| **Image Compressor** | Iterative smart encoding to hit target file sizes in KB. |
| **Format Converter** | Professional transcoding between 12+ formats including AVIF and HEIC. |
| **Social Media Resizer** | One-click resize for IG, TikTok, YouTube with safe-area overlays. |
| **GIF Maker** | Combine images into animated GIFs with frame control. |
| **Before/After Slider** | Interactive comparison deck with smooth touch-masking. |

### 📄 PDF Tools
| Tool | Description |
|---|---|
| **Merge & Split** | Drag, arrange, and seamlessly combine or extract PDF files. |
| **PDF to Images** | Convert each page to high-quality PNG with per-page progress. |
| **Password Manager** | Add **AES-256** encryption or remove passwords via local `qpdf` backend. |
| **Remove Blank Pages** | Smart pixel-density analysis to auto-sanitize documents. |

### 🤖 AI Utilities
| Tool | Description |
|---|---|
| **Screenshot to Code** | Convert UI mockups into clean **Tailwind CSS + HTML** code. |
| **AI PDF Summariser** | Intelligent recursive summarisation for large documents. |
| **AI Alt-Text Writer** | Accurate accessibility descriptions from any image. |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | React, TypeScript | Type-safe component architecture |
| **Build** | Vite | Sub-second HMR, optimized code splitting |
| **Animation** | Framer Motion | Smooth layout transitions and interactive toggles |
| **Canvas Engine** | Fabric.js | Rich interactive canvas editing & composition |
| **Video Engine** | `ffmpeg.wasm` | Multi-threaded browser video processing |
| **Serverless API** | Vercel Functions | Secure AI API key proxying (Gemini & Groq) |
| **Icons** | Lucide React | Consistent icon system across all tools |

---

## 📂 Project Structure

```text
├── api/                             # Vercel Serverless Functions (AI Proxy)
│   ├── ai-proxy.ts                  # Secure proxy for Gemini/Groq API calls
├── server/                          # Local PDF encryption backend
│   ├── server.js                    # Express + qpdf bridge
├── src/
│   ├── components/
│   │   ├── layout/                  # ToolLayout, ToolUploadLayout, Navbar
│   │   ├── shared/                  # PillToggle, ModeToggle, DropZone
│   │   ├── tools/                   # 110+ Categorized tools
│   │   └── ui/                      # shadcn/ui primitives
│   ├── hooks/
│   │   ├── useObjectUrl.ts          # Centralized memory management
│   │   └── useImageProcessor.ts     # Heavy task orchestration
│   ├── lib/
│   │   ├── canvas/                  # draw, export, guards, loadImage
│   │   └── utils.ts                 # cn, maybeYield, safeRevoke
│   └── main.tsx                     # React DOM mount
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
