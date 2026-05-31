<h1 align="center">✦ Vanity</h1>
<p align="center"><strong>Image, PDF & Dev tools — all private, all free</strong></p>

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

## About

Vanity is a browser-first utility suite that replaces those clunky desktop apps and overpriced subscription sites. 100+ tools for images, PDFs, video, text, and dev work — all running on your machine. Nothing gets uploaded.

> **Your files stay yours.** Everything runs locally using Canvas, WebAssembly, Fabric.js, and browser file streams. No servers, no uploads, no tracking.

---

## Features

### Image Tools

| Tool | What it does |
|---|---|
| **EXIF Sanitizer** | Strips GPS and device metadata. Works in batch. |
| **Social Media Resizer** | One-click resize for Instagram, TikTok, YouTube. |
| **Collage Maker** | Drag, gap, background — export multi-layer collages. |
| **ICC Profile Stripper** | Removes embedded color profiles, normalizes to sRGB. |
| **Image Compressor** | Smart encoding to hit specific file sizes. |
| **GIF Maker** | Turns images into animated GIFs with frame control. |

### PDF Tools

| Tool | What it does |
|---|---|
| **PDF Editor Lite** | Add text, signatures, highlights via canvas overlays. |
| **Merge & Split** | Drag to rearrange, combine, or extract pages. |
| **PDF Watermark** | Stamps text across pages with opacity control. |
| **Password Manager** | AES-256 encrypt or decrypt via local `qpdf`. |

### Developer Tools

| Tool | What it does |
|---|---|
| **Color Studio** | Picker, palette builder, WCAG contrast audit. |
| **Secure Pastebin** | Encrypted sharing via URL fragments. No server storage. |
| **JSON Schema Validator** | Live validation against Draft-7 schemas. |
| **CSS Effects Builder** | Visual box-shadow and filter editor. |
| **Fake Data Generator** | Generates SQL/JSON/CSV with custom schemas. |

---

## Tech Stack

| Layer | What we use |
|---|---|
| **Runtime** | React + TypeScript |
| **Build** | Vite + LightningCSS |
| **Encryption** | Crypto-JS (client-side AES-256) |
| **Canvas** | Fabric.js |
| **Video** | ffmpeg.wasm |
| **Serverless** | Vercel Functions (AI proxy only) |
| **Icons** | Lucide React |

---

## Project Structure

```text
src/
├── components/
│   ├── layout/       # ToolLayout, ToolUploadLayout, Navbar
│   ├── shared/       # ColorPickerInput, PillToggle, DropZone
│   ├── tools/        # 110+ tools, lazy loaded by category
│   └── ui/           # shadcn/ui primitives
├── hooks/
│   ├── useObjectUrl.ts
│   └── useCopyToClipboard.ts
├── lib/
│   ├── canvas/       # draw, export, guards, loadImage
│   └── utils.ts
└── main.tsx
```

---

## Getting Started

**Requirements:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/YumiNoona/Vanity.git
cd Vanity
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> `qpdf` is needed only for PDF password features.

---

## Design System

| Token | Value | Where it's used |
|---|---|---|
| Background | `#0A0A0A` | Dark mode base |
| Primary | `#F59E0B` (Amber) | Buttons, links, glows |
| Font (Display) | Syne | Headlines, tool titles |
| Font (Body) | DM Sans | Body text, labels |
| Glass | `bg-white/[0.03]` | Cards, panels |

---

## Support

Vanity is and will always be free. No ads, no tracking, no data selling. If you want to help keep it running:

- **UPI**: `rushikeshingale2001@okicici`

---

## Contributing

Open an issue first if you want to change something. PRs welcome.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Built with 💙 Made by Veil
</p>
