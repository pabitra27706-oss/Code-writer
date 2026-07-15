
# 🎬 CodeType Studio

> Transform your code into beautiful typing animations — record and share as MP4 or WebM video.

![CodeType Studio](https://img.shields.io/badge/version-2.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)

---

## ✨ What Is It?

**CodeType Studio** is a browser-based tool that animates code being typed
in a realistic VS Code-style editor. You can record the animation as a
video and download it — perfect for:

- 📹 Social media coding content
- 🎓 Tutorial and course videos
- 💼 Portfolio showcases
- 🖥️ Tech presentations and demos

No installation. No backend. Runs entirely in the browser.

---

## 🚀 Features

### ✍️ Typing Animation
- Character-by-character reveal at **1–200 chars/sec**
- **Humanize mode** — natural variation in typing speed, micro-pauses,
  burst typing
- **Typo simulation** — realistic mistakes with backspace correction
- **Word suggestions** — ghost text shows the next word as it's being typed
  (like VS Code inline suggestions)
- **Keyboard sounds** — subtle audio feedback per keystroke
- **Newline delay** — configurable pause between lines

### 🎨 Editor Appearance
- **8 built-in themes:**
  - Tokyo Night
  - Dracula
  - GitHub Dark
  - Monokai
  - Nord
  - Solarized Dark
  - One Dark Pro
  - Catppuccin Mocha
- **Syntax highlighting** for 30+ languages via highlight.js
- **4 font sizes** — Small, Medium, Large, XL
- **3 cursor styles** — Line `|`, Block `█`, Underline `_`
- **Minimap** — scrollable code overview panel
- **SVG file icons** — per-language tab icons
- **Fullscreen mode** — distraction-free preview

### 🎥 Recording
- Records the live canvas animation
- Output formats: **MP4 (H.264)** and **WebM (VP9)**
- Quality presets: **720p, 1080p, 1440p, 4K**
- Aspect ratios: **16:9, 9:16, 1:1, 4:3**
- **Watermark** — custom text with position and opacity control
- **End buffer** — hold on the final frame before cutting
- Preview video before downloading
- File named automatically from your code filename

### 📱 Mobile Support
- Full settings drawer on mobile
- All controls synced between desktop and mobile
- Swipe down to close drawer
- Touch-friendly UI

### ⚙️ Other
- **30+ languages** supported
- **File import** — drag and drop or browse (up to 500KB)
- **Share link** — encode current code + settings into a URL
- **Settings persistence** — all preferences saved to localStorage
- **Estimated time** — shows how long the animation will take
- **Live char/line count**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `R` | Start / Stop recording |
| `F` | Toggle fullscreen |
| `Escape` | Reset / Close drawer |
| `↑ / ↓` | Speed +5 / -5 |
| `→ / ←` | Speed +20 / -20 |
| `Ctrl + Enter` | Play |
| `Ctrl + S` | Download recording |
| `Ctrl + O` | Import file |

---

## 🌐 Supported Languages

| Category | Languages |
|----------|-----------|
| **Web** | JavaScript, TypeScript, HTML, CSS, SCSS, Sass, Less, Vue, Svelte, GraphQL |
| **Backend** | Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, Dart, Perl |
| **Data** | JSON, XML, YAML, TOML, INI, SQL |
| **Scripts** | Bash, PowerShell, Lua, R |
| **Docs** | Markdown, Plain Text |

---

## 🗂️ Project Structure

```
codetype-studio/
│
├── index.html                 # Main HTML — desktop + mobile layout
│
├── js/
│   ├── app.js                 # Main controller — all UI wiring
│   ├── typing-engine.js       # Animation core — timing, humanize, typos
│   ├── highlight-parser.js    # Code tokenizer — progressive char reveal
│   ├── editor-ui.js           # Editor DOM — lines, cursor, themes, minimap
│   ├── theme-engine.js        # Theme CSS variable applicator
│   ├── recorder.js            # Canvas → MP4/WebM video recorder
│   └── toast.js               # Notification + confirm dialog system
│
├── css/
│   ├── main.css               # App layout, controls, mobile
│   ├── editor.css             # VS Code-style editor styles
│   └── themes.css             # All 8 theme CSS variable definitions
│
└── README.md
```

---

## 🛠️ How It Works

```
User pastes code
      ↓
HighlightParser.parse()
  → highlight.js tokenizes the code
  → HTML is split into per-character tokens
  → Tokens organized into lines with balanced tags
      ↓
TypingEngine.play()
  → Fires onTick() every N milliseconds (based on speed)
  → Each tick reveals one more character
  → Humanize adds natural variation to delay
  → Typo system occasionally inserts wrong char + backspace
      ↓
EditorUI renders each tick
  → buildPartialLine() reconstructs valid HTML for N chars
  → Cursor + ghost suggestion appended
  → Active line highlighted
  → Minimap updated
      ↓
(If recording) Recorder captures canvas every frame
  → MediaRecorder encodes to MP4 or WebM
  → Blob shown in preview overlay
  → User downloads the video
```

---

## ⚡ Speed System

Speed is measured in **characters per second (chars/sec)**:

| Range | Label | Behavior |
|-------|-------|----------|
| 1–15 | 🐢 Very Slow | Heavy humanization, thinking pauses |
| 16–30 | 🐌 Slow | Natural variation |
| 31–60 | 👆 Medium | Moderate variation |
| 61–100 | ⚡ Fast | Light variation |
| 101–150 | 🚀 Very Fast | Minimal variation |
| 151–200 | 🔥 Blazing | Near-zero jitter only |

At high speeds (80+ chars/sec) humanization is automatically reduced
so the actual speed stays accurate.

---

## 🎨 Themes

Each theme defines CSS variables for:
- Editor background, titlebar, borders
- Line numbers (normal + active)
- Cursor color
- Syntax: keywords, strings, numbers, comments, functions,
  types, operators, properties, and more

Themes are applied via `data-theme` attribute on the editor window,
with variables consumed by `.hljs-*` syntax classes.

---

## 📦 Dependencies

| Library | Purpose | Loaded via CDN |
|---------|---------|----------------|
| [highlight.js](https://highlightjs.org/) | Syntax highlighting | ✅ |

Everything else is **vanilla JavaScript**. No frameworks, no build step.

---

## 🚀 Getting Started

### Option 1 — Open directly
```bash
# Just open index.html in any modern browser
open index.html
```

### Option 2 — Serve locally
```bash
# Python
python -m http.server 8080

# Node
npx serve .

# Then open http://localhost:8080
```

### Option 3 — Deploy
Upload all files to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

No server-side code required.

---

## 🔗 Share Links

Clicking **Copy Link** encodes the current state into a URL:

```
https://yoursite.com/?c=BASE64_CODE&l=javascript&f=index.js&s=40&t=tokyo-night
```

| Param | Meaning |
|-------|---------|
| `c` | Base64-encoded code (max 2000 chars) |
| `l` | Language |
| `f` | Filename |
| `s` | Speed |
| `t` | Theme |

---

## 🖥️ Browser Support

| Browser | Play | Record |
|---------|------|--------|
| Chrome 90+ | ✅ | ✅ MP4 + WebM |
| Edge 90+ | ✅ | ✅ MP4 + WebM |
| Firefox 90+ | ✅ | ✅ WebM only |
| Safari 15+ | ✅ | ⚠️ Limited |
| Mobile Chrome | ✅ | ✅ |
| Mobile Safari | ✅ | ⚠️ Limited |

> Recording uses the **MediaRecorder API**. MP4 support depends on
> the browser's H.264 codec availability.

---

## 📄 License

MIT License — free to use, modify and distribute.

---

## 🙌 Credits

- **highlight.js** — syntax highlighting engine
- **VS Code** — design inspiration for the editor UI
- Built with ❤️ using vanilla HTML, CSS and JavaScript
```