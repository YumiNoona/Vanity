# 🛠️ Vanity
**The All-In-One Private Image & PDF Utility Suite**

Edit images, merge PDFs, remove backgrounds, and optimize assets directly from your browser. 100% free, blazingly fast, and completely secure.

**[Live Demo](#) | [GitHub](#)**

`React 18` ✦ `TypeScript` ✦ `Vite` ✦ `Tailwind CSS` ✦ `WebAssembly` ✦ `shadcn/ui`

---

## 📖 Summary

**Vanity** is a modern, premium-grade web application designed to replace clunky desktop software and subscription-heavy utility sites. It bundles dozens of powerful Image, PDF, and AI tools into a completely client-side application. 

**Privacy by Design**: Rather than relying on expensive backends, Vanity leverages modern Web APIs — including `Canvas`, `WASM`, and browser-based file streams (`pdf-lib`) — to process all user data locally. Your files never leave your machine!

A local monetization state is structured seamlessly with simulated premium tokens unlocking high-end functionalities without a forced refresh. 

---

## ✨ Features

### 🖼️ Core Image Tools
| Feature | Description |
|---|---|
| **Remove Background (AI)** | ML-powered background carving running locally in-browser via WebAssembly (`@imgly/background-removal`). |
| **Image Effects** | Native Canvas modifications for Brightness, Contrast, Saturation, Sepia, Grayscale, and Blur filtering. |
| **Asset Compressor** | Resize and compress heavy assets to smaller WebP/JPEG footprints using lossless or lossy degradation. |
| **Crop & Resize** | Flexible crop parameters directly tied to a reactive Fabric/Canvas viewport. |

### 📄 PDF Utilities
| Feature | Description |
|---|---|
| **Merge PDFs** | Drag, arrange, and seamlessly bind multiple PDFs using `pdf-lib` direct stream interactions. |
| **Split PDFs** | Extract pages directly into new blobs or individualized download bundles. |
| **Security Passwords** | Inject or strip 128-bit file passwords for standard compliance checking. |
| **PDF Compression** | Client-side metadata stripping to heavily decrease raw PDF footprints. |

### 💳 Monetization & Security
| Feature | Description |
|---|---|
| **Ad-Free Toggle** | Simulated Google AdSense slotting disabled via local storage key-checking hook models (`usePremium`). |
| **Batch Processing** | 5 files at a time on Free limits, instantly expanded to 50 via Premium token. |
| **Local Toggles** | Upgrade paths don’t require a centralized database. The `PremiumUtils` unlocks tools entirely on the DOM. |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Setup** | Vite, React 18, TypeScript | Instant server starts, heavy typing, lightning fast HMR. |
| **Styling** | Tailwind CSS v3, CSS variables | Absolute control over dark mode tokens and utility generation. |
| **Component UI** | shadcn/ui, Radix Primitives | Beautiful, accessible, headless DOM wrappers. |
| **Animations** | Framer Motion, Canvas Confetti | Complex staggered entrance delays, success sparks. |
| **Icons** | Lucide React | Highly consistent icon typography across 20+ applications. |
| **PDF Core** | `pdf-lib` | Standardized reading and writing of PDF binary layouts. |
| **AI ML Core** | `@imgly/background-removal` | Client-side neural models parsing via WASM. |

---

## 📂 Project Structure

```text
Vanity/
│
├── public/                             # Static Assets
├── src/                                # ─── Application Root ───
│   │
│   ├── components/                     # Core React Domains
│   │   ├── layout/                     #   App Layouts
│   │   │   ├── AppLayout.tsx           #     Main shell encapsulating nav/side
│   │   │   ├── Navbar.tsx              #     Ad/Premium-aware top navigation
│   │   │   └── Sidebar.tsx             #     Collapsible side array for active tools
│   │   ├── shared/                     #   Globally referenced elements
│   │   │   ├── AdSlot.tsx              #     Simulated Adsense injection wrapper
│   │   │   └── DropZone.tsx            #     React-dropzone drag & drop wrapper
│   │   ├── tools/                      #   Functional Utility Apps
│   │   │   ├── image/                  #     Image-scoped functionality
│   │   │   │   ├── ImageEffects.tsx    #       Canvas-based filter controls
│   │   │   │   └── RemoveBg.tsx        #       WASM-powered background ML logic
│   │   │   └── pdf/                    #     PDF-scoped functionality
│   │   │       └── MergePdf.tsx        #       Multi-file `pdf-lib` merge generator
│   │   └── ui/                         #   Shadcn & Headless primitives
│   │
│   ├── config/                         # Standardized App Memory
│   │   └── tools.ts                    #   Object array mapping icons, routes, tools
│   │
│   ├── hooks/                          # Custom Hooks
│   │   └── usePremium.ts               #   Local-storage monetization checks
│   │
│   ├── lib/                            # Helper utilities
│   │   └── utils.ts                    #   Tailwind merge classes
│   │
│   ├── pages/                          # Core Route Targets
│   │   └── Home.tsx                    #   Animated grid displaying available tools
│   │
│   ├── App.tsx                         # BrowserRouter Setup
│   ├── index.css                       # Dark global tokens + CSS blobs/noise vars
│   └── main.tsx                        # Initial React DOM Mount
│
├── tailwind.config.js                  # Deep styling extension map
├── postcss.config.js                   # Pre-processor instructions
├── package.json                        # Root dependencies and Vite targets
└── tsconfig.app.json                   # Strict TS mappings
```

---

## 💰 Subscription Plans

| Capability | FREE | PRO ($4.99/mo) |
|---|---|---|
| **Max Files Per Batch** | 5 | 50 |
| **File Limit Maximum** | 10 MB | 100 MB |
| **Ad Experience** | Active AdSense units | None (Zero Ads) |
| **AI Processing Model** | Local Standard | Dedicated Output Paths |

---

## 🚀 Getting Started

### 1. Clone & Install
Ensure you have Node.js installed on your OS.

```bash
git clone https://github.com/YourName/Vanity.git
cd Vanity
npm install
```

### 2. Run the Platform

```bash
npm run dev
```

Point your browser to `http://localhost:5173`. You'll immediately launch into the interface.

---

## 🎨 UI Conventions

- **Typography**: Heavily relies on **Syne** for bold visual structure (`h1`, `h2`), and **DM Sans** for paragraph readability.
- **Colors**: Hex locks into `#0A0A0A` for pure aesthetic dark background and relies upon `#F59E0B` (Amber) for interactive glowing focal points.
- **Micro-interactions**: A continuous use of shadow spreads bounding the interactive elements: `shadow-[0_0_20px_rgba(245,158,11,0.2)]` combined with Framer hover scales.
- **Components**: Employs `.glass-panel` utilities with extremely light semi-transparent whites (`bg-white/[0.03]`) against hard backdrops for physical depth without borders.

---

📝 **License**

This project is licensed under the MIT License — see the LICENSE file for details.
