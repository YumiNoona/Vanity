<h1 align="center">✦ Vanity</h1>
<p align="center"><strong>The All-In-One Private Image, PDF & Dev Utility Suite — 100% Free</strong></p>

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
  <img src="https://img.shields.io/badge/AES--256-Encrypted-red?style=flat-square" alt="AES-256" />
</p>

---

## 📖 About

**Vanity** is a modern, premium-grade web application that replaces clunky desktop software and subscription-heavy utility sites. It bundles dozens of powerful Image, PDF, and Dev tools into a completely **client-side** application.

> **🔒 Privacy by Design** — Vanity leverages modern Web APIs including `Canvas`, `WebAssembly`, `Fabric.js`, and browser-native file streams to process all user data locally. **Your files never leave your machine.**

### 🏗️ Architecture Highlights

- **Standardized Tool Architecture** — All 100+ tools migrated to a unified `ToolLayout` and `ToolUploadLayout` system for consistent UX and responsive design.
- **Dynamic Optimization** — Strategic code-splitting and lazy-loading for heavy libraries like `fabric`, `pdf-lib`, and `zxcvbn` to ensure sub-second initial load.
- **Unified Color Engine** — Custom-built `ColorPickerInput` with native **EyeDropper API** integration across all creative tools.
- **Industrial Dimensions Guard** — Mobile-aware (10MP) vs Desktop (20MP) scaling protects against OOM crashes.
- **Time-Budgeted Yielding** — 10ms `maybeYield` loops maintain 60fps during heavy pixel manipulations.
- **Bulletproof Memory Hygiene** — Tracked Object URL lifecycles via `useObjectUrl` and recursive canvas disposal.

---

## ✨ Features

### 🖼️ Image Tools
| Tool | Description |
|---|---|
| **EXIF Sanitizer** | Strip GPS and device metadata locally; batch mode supported. |
| **Social Media Resizer** | Cinematic 16:9 previews with one-click resize for IG, TikTok, YouTube. |
| **Collage Maker** | Interactive canvas with custom gaps, backgrounds, and multi-layer exports. |
| **ICC Profile Stripper** | Normalize colors to sRGB by removing embedded color profiles. |
| **Image Compressor** | Iterative smart encoding to hit target file sizes in KB. |
| **GIF Maker** | Combine images into animated GIFs with frame control. |

### 📄 PDF Tools
| Tool | Description |
|---|---|
| **PDF Editor Lite** | Add text, signatures, and highlights with high-fidelity canvas overlays. |
| **Merge & Split** | Drag, arrange, and seamlessly combine or extract PDF files. |
| **PDF Watermark** | Add persistent text stamps across all pages with opacity control. |
| **Password Manager** | Add **AES-256** encryption or remove passwords via local `qpdf` backend. |

### 🛠️ Developer Tools
| Tool | Description |
|---|---|
| **Color Studio** | Pro picker with **EyeDropper**, Palette Builder, and WCAG Accessibility audit. |
| **Secure Pastebin** | Serverless sharing with **Client-Side AES Encryption** and file upload. |
| **JSON Schema Validator** | Live validation against Draft-7 schemas with inline error highlighting. |
| **CSS Effects Builder** | Visual editor for complex Box-Shadows and CSS Filters. |
| **Fake Data Generator** | Generate millions of rows for SQL/JSON/CSV with custom schemas. |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | React, TypeScript | Type-safe component architecture |
| **Build** | Vite + LightningCSS | Sub-second HMR, optimized code splitting, ultra-fast CSS |
| **Encryption** | Crypto-JS | Client-side AES-256 for secure links and PDF metadata |
| **Canvas Engine** | Fabric.js | Rich interactive canvas editing & composition |
| **Video Engine** | `ffmpeg.wasm` | Multi-threaded browser video processing |
| **Serverless API** | Vercel Functions | Secure AI API key proxying (Gemini & Groq) |
| **Icons** | Lucide React | Consistent icon system across all tools |

---

## 📂 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── layout/                  # ToolLayout, ToolUploadLayout, Navbar
│   │   ├── shared/                  # ColorPickerInput, PillToggle, DropZone
│   │   ├── tools/                   # 110+ Categorized tools (Lazy Loaded)
│   │   └── ui/                      # shadcn/ui primitives
│   ├── hooks/
│   │   ├── useObjectUrl.ts          # Centralized memory management
│   │   └── useCopyToClipboard.ts    # Secure state-aware clipboard logic
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
- **qpdf** (Required only for PDF password removal/encryption features)

### Installation

```bash
git clone https://github.com/YumiNoona/Vanity.git
cd Vanity
npm install
```

#### 🌐 Start Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| **Background** | `#0A0A0A` | Pure dark aesthetic base |
| **Primary** | `#F59E0B` (Amber) | Interactive elements, CTAs, glows |
| **Font (Display)** | Syne | Headlines, branding, tool titles |
| **Font (Body)** | DM Sans | Paragraphs, labels, descriptions |
| **Glass Panels** | `bg-white/[0.03]` | Depth without hard borders |

---

## 💖 Support the Project

Vanity is and will always be **100% free** and open. We don't show ads, we don't track you, and we don't sell your data. To keep this project alive and cover the costs of hosting and AI processing, we rely entirely on community donations.

- **UPI ID**: `rushikeshingale2001@okicici`
- **Goal**: Keep Vanity forever free for everyone.

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
