import React, { useState, useEffect, useCallback } from "react"
import { BookOpen, Copy, CheckCircle, Download, Sparkles, Plus, X, Search } from "lucide-react"
import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { marked } from "marked"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { useDownload } from "@/hooks/useDownload"

// --- Badge Data ---
const BADGE_CATEGORIES: Record<string, { label: string; badges: { name: string; url: string }[] }> = {
  frontend: {
    label: "Frontend",
    badges: [
      { name: "React", url: "https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" },
      { name: "Next.js", url: "https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white" },
      { name: "Vue.js", url: "https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D" },
      { name: "Angular", url: "https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" },
      { name: "Svelte", url: "https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00" },
      { name: "TailwindCSS", url: "https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" },
      { name: "TypeScript", url: "https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" },
      { name: "JavaScript", url: "https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" },
      { name: "HTML5", url: "https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" },
      { name: "CSS3", url: "https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" },
    ]
  },
  backend: {
    label: "Backend",
    badges: [
      { name: "Node.js", url: "https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" },
      { name: "Express", url: "https://img.shields.io/badge/Express-000?style=for-the-badge&logo=express&logoColor=white" },
      { name: "Python", url: "https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" },
      { name: "Django", url: "https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" },
      { name: "FastAPI", url: "https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" },
      { name: "Go", url: "https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" },
      { name: "Rust", url: "https://img.shields.io/badge/Rust-000?style=for-the-badge&logo=rust&logoColor=white" },
      { name: "Java", url: "https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" },
      { name: "C#", url: "https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white" },
      { name: "PHP", url: "https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" },
    ]
  },
  devops: {
    label: "DevOps & Cloud",
    badges: [
      { name: "Docker", url: "https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" },
      { name: "Kubernetes", url: "https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" },
      { name: "AWS", url: "https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white" },
      { name: "Vercel", url: "https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel&logoColor=white" },
      { name: "Netlify", url: "https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" },
      { name: "GitHub Actions", url: "https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" },
      { name: "Supabase", url: "https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" },
      { name: "Firebase", url: "https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" },
    ]
  },
  database: {
    label: "Databases",
    badges: [
      { name: "PostgreSQL", url: "https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" },
      { name: "MongoDB", url: "https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" },
      { name: "MySQL", url: "https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" },
      { name: "Redis", url: "https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" },
      { name: "SQLite", url: "https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" },
      { name: "Prisma", url: "https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" },
    ]
  },
  gamedev: {
    label: "Game Dev",
    badges: [
      { name: "Unity", url: "https://img.shields.io/badge/Unity-000?style=for-the-badge&logo=unity&logoColor=white" },
      { name: "Unreal Engine", url: "https://img.shields.io/badge/Unreal_Engine-0E1128?style=for-the-badge&logo=unrealengine&logoColor=white" },
      { name: "Godot", url: "https://img.shields.io/badge/Godot-478CBF?style=for-the-badge&logo=godotengine&logoColor=white" },
      { name: "C++", url: "https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" },
      { name: "Lua", url: "https://img.shields.io/badge/Lua-2C2D72?style=for-the-badge&logo=lua&logoColor=white" },
      { name: "Blender", url: "https://img.shields.io/badge/Blender-F5792A?style=for-the-badge&logo=blender&logoColor=white" },
    ]
  },
  meta: {
    label: "Meta Badges",
    badges: [
      { name: "License MIT", url: "https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" },
      { name: "License GPL", url: "https://img.shields.io/badge/License-GPL_v3-blue.svg?style=for-the-badge" },
      { name: "PRs Welcome", url: "https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" },
      { name: "Made with Love", url: "https://img.shields.io/badge/Made_with-❤️-red.svg?style=for-the-badge" },
      { name: "Open Source", url: "https://img.shields.io/badge/Open_Source-💚-green.svg?style=for-the-badge" },
    ]
  }
}

// --- Templates ---
const TEMPLATES: { id: string; name: string; content: string }[] = [
  {
    id: "general",
    name: "General Project",
    content: `# 🚀 Project Name

> A brief, compelling description of what your project does.

![Banner](https://via.placeholder.com/1200x400/1a1a2e/e0e0e0?text=Your+Project+Banner)

## ✨ Features

- ⚡ **Fast** — Built for speed and performance
- 🔒 **Secure** — Privacy-first architecture
- 🎨 **Beautiful** — Modern, clean UI/UX
- 📱 **Responsive** — Works on all devices

## 📦 Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git

# Navigate to directory
cd project

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## 🛠️ Usage

\`\`\`javascript
import { MyProject } from 'my-project'
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { useDownload } from "@/hooks/useDownload";

const app = new MyProject({
  theme: 'dark',
  locale: 'en'
});
\`\`\`

## 📸 Screenshots

| Dashboard | Settings |
|-----------|----------|
| ![Dashboard](https://via.placeholder.com/400x300) | ![Settings](https://via.placeholder.com/400x300) |

## 🗺️ Roadmap

- [x] Core functionality
- [x] Documentation
- [ ] API integration
- [ ] Mobile app
- [ ] Internationalization

## 🤝 Contributing

Contributions are always welcome! See \`CONTRIBUTING.md\` for ways to get started.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ by <a href="https://github.com/username">Your Name</a></p>`
  },
  {
    id: "saas",
    name: "SaaS Product",
    content: `<div align="center">

# ☁️ ProductName

### The modern platform for teams who ship fast.

[![Deploy](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

[Demo](https://demo.example.com) · [Docs](https://docs.example.com) · [Report Bug](https://github.com/org/repo/issues)

</div>

---

## 🎯 What is ProductName?

ProductName is a **next-generation SaaS platform** that helps development teams collaborate, ship, and iterate faster than ever before. Built with modern web technologies and deployed on the edge.

## 💡 Key Features

| Feature | Description |
|---------|-------------|
| 🔄 **Real-time Sync** | Collaborate with your team in real-time |
| 📊 **Analytics** | Built-in analytics dashboard |
| 🔐 **SSO & RBAC** | Enterprise-grade security |
| 🌐 **API First** | RESTful API with OpenAPI spec |
| ⚡ **Edge Deployed** | Sub-50ms response times globally |

## 🏗️ Tech Stack

<!-- Add your badges here -->

## 🚀 Quick Start

\`\`\`bash
npx create-productname-app my-app
cd my-app
npm run dev
\`\`\`

## 📖 Documentation

Full documentation is available at [docs.example.com](https://docs.example.com).

## 💰 Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | Free | 3 projects, 1 user |
| **Pro** | $19/mo | Unlimited projects, 5 users |
| **Enterprise** | Custom | SSO, SLA, dedicated support |

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## 📄 License

MIT © [Your Company](https://example.com)`
  },
  {
    id: "game",
    name: "Game Project",
    content: `<div align="center">

# 🎮 Game Title

### An epic adventure awaits.

![Game Banner](https://via.placeholder.com/1200x500/0d1117/58a6ff?text=🎮+Game+Banner)

[![Engine](https://img.shields.io/badge/Godot-4.0-blue?style=for-the-badge&logo=godotengine)](https://godotengine.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20Mac-lightgrey?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Download](https://example.com) · [Wiki](https://github.com/user/game/wiki) · [Discord](https://discord.gg/example)

</div>

---

## 📖 About

**Game Title** is a 2D/3D action-adventure game built with Godot Engine. Explore procedurally generated worlds, battle enemies, and uncover ancient mysteries.

## 🎮 Gameplay

- 🗡️ **Combat** — Fast-paced real-time combat system
- 🌍 **Exploration** — Procedurally generated worlds
- 📜 **Story** — Rich narrative with branching dialogue
- 🎵 **Soundtrack** — Original orchestral score
- 🏆 **Achievements** — 50+ achievements to unlock

## 📸 Screenshots

| Overworld | Combat | Inventory |
|-----------|--------|-----------|
| ![Overworld](https://via.placeholder.com/300x200) | ![Combat](https://via.placeholder.com/300x200) | ![Inventory](https://via.placeholder.com/300x200) |

## 🛠️ Building from Source

\`\`\`bash
# Clone repository
git clone https://github.com/user/game.git

# Open in Godot 4.0+
# Project > Open > Select project.godot

# Press F5 to run
\`\`\`

## 🗺️ Development Roadmap

- [x] Core movement & physics
- [x] Combat system
- [x] Procedural generation
- [ ] Multiplayer co-op
- [ ] Console ports
- [ ] Mod support

## 🤝 Contributing

Interested in contributing? Check out our [Contributing Guide](CONTRIBUTING.md) and join our [Discord](https://discord.gg/example).

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">Built with ❤️ and ☕ using Godot Engine</p>`
  }
]

export function ReadmeViewer() {
  const [input, setInput] = useState(TEMPLATES[0].content)
  const [html, setHtml] = useState("")
  const { isCopied: copied, copy } = useCopyToClipboard()
  const { download } = useDownload()
  const [activeTab, setActiveTab] = useState<"edit" | "badges">("edit")
  const [badgeSearch, setBadgeSearch] = useState("")
  const [activeBadgeCat, setActiveBadgeCat] = useState("frontend")

  useEffect(() => {
    const parse = async () => {
      const result = await marked.parse(input)
      setHtml(result)
    }
    parse()
  }, [input])

  const handleCopy = () => {
    copy(input, "Markdown copied to clipboard")
    }

  const handleDownload = () => {
    download(input, "README.md")
  }

  const insertBadge = (badge: { name: string; url: string }) => {
    const md = `![${badge.name}](${badge.url})\n`
    setInput(prev => md + prev)
    toast.success(`${badge.name} badge added`)
  }

  const loadTemplate = (id: string) => {
    const tpl = TEMPLATES.find(t => t.id === id)
    if (tpl) {
      setInput(tpl.content)
      toast.success(`Loaded "${tpl.name}" template`)
    }
  }

  const filteredBadges = badgeSearch.trim()
    ? Object.values(BADGE_CATEGORIES).flatMap(c => c.badges).filter(b => b.name.toLowerCase().includes(badgeSearch.toLowerCase()))
    : BADGE_CATEGORIES[activeBadgeCat]?.badges || []

  return (
    <ToolLayout
      title="README Previewer"
      description="Preview GitHub READMEs with templates, badges, and live rendering."
      icon={BookOpen}
      maxWidth="max-w-7xl"
      centered={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Top Controls */}
          <div className="flex flex-col items-center space-y-6 mb-2">
            <div className="flex items-center justify-between w-full gap-4">
              <PillToggle
                activeId={activeTab}
                onChange={setActiveTab}
                options={[
                  { id: "edit", label: "Editor", icon: BookOpen },
                  { id: "badges", label: "Badges", icon: Sparkles },
                ]}
              />
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all">
                  {copied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={handleDownload} className="px-4 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  <Download className="w-3 h-3" /> Export
                </button>
              </div>
            </div>

            {/* Templates Strip */}
            <div className="flex gap-2 flex-wrap justify-center">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t.id)}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-white"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "edit" ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 min-h-[60vh] bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm resize-none outline-none focus:border-primary/30 transition-all text-white/90 custom-scrollbar"
              spellCheck={false}
              placeholder="Start writing your README..."
            />
          ) : (
            <div className="flex-1 min-h-[60vh] bg-black/40 border border-white/10 rounded-2xl p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={badgeSearch}
                  onChange={(e) => setBadgeSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all"
                />
              </div>

              {/* Category Tabs */}
              {!badgeSearch && (
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(BADGE_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      onClick={() => setActiveBadgeCat(key)}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        activeBadgeCat === key ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Badge Grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredBadges.map(badge => (
                  <button
                    key={badge.name}
                    onClick={() => insertBadge(badge)}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <img src={badge.url} alt={badge.name} className="h-6 rounded" loading="lazy" />
                    <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </button>
                ))}
              </div>
              {filteredBadges.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8 italic">No badges found.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel — GitHub-style Preview */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> GitHub Preview
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex-1 min-h-[60vh] bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-auto custom-scrollbar">
            {/* Fake GitHub tab bar */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
              <div className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0d1117] border border-[#30363d] border-b-[#0d1117] rounded-t-md -mb-[13px]">
                README.md
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 prose prose-invert prose-emerald max-w-none readme-github-theme">
              <div dangerouslySetInnerHTML={{ __html: html }} />
              {input === "" && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 italic text-sm py-20">
                  <BookOpen className="w-12 h-12 mb-4" />
                  Start typing or pick a template to preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .readme-github-theme {
          color: #e6edf3;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
        }
        .readme-github-theme h1 { border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
        .readme-github-theme h2 { border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
        .readme-github-theme a { color: #58a6ff; text-decoration: none; }
        .readme-github-theme a:hover { text-decoration: underline; }
        .readme-github-theme code { background: rgba(110,118,129,0.4); padding: 0.2em 0.4em; border-radius: 6px; font-size: 85%; color: #e6edf3; }
        .readme-github-theme pre { background: #161b22 !important; border: 1px solid #30363d; border-radius: 6px; padding: 16px; overflow-x: auto; }
        .readme-github-theme pre code { background: transparent; padding: 0; }
        .readme-github-theme blockquote { border-left: 4px solid #30363d; color: #8b949e; padding: 0 1em; margin: 0; }
        .readme-github-theme table { border-collapse: collapse; width: 100%; }
        .readme-github-theme th, .readme-github-theme td { border: 1px solid #30363d; padding: 6px 13px; }
        .readme-github-theme tr:nth-child(2n) { background: #161b22; }
        .readme-github-theme img { max-width: 100%; border-radius: 6px; }
        .readme-github-theme hr { border: none; border-top: 1px solid #30363d; }
        .readme-github-theme ul, .readme-github-theme ol { padding-left: 2em; }
        .readme-github-theme li { margin: 0.25em 0; }
        .readme-github-theme input[type="checkbox"] { margin-right: 0.5em; accent-color: #58a6ff; }
      `}</style>
    </ToolLayout>
  )
}
