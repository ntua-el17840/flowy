# flowy · Phase 0-2 ultra-granular checklist ( Vite + Plasmo + *type-ahead* additions )

> Tick each box in order.  
> Convention: `[ ]` = to-do `[x]` = done

---

## Phase 0 · Boilerplate & CI (Week 0 → 1)

- [x] **Repository**
  - [x] `git init flowy && cd flowy`
  - [x] `pnpm init -y`
  - [x] Add `README.md`, MIT licence, `.gitignore`
- [x] **Plasmo + Vite scaffold**
  - [x] `pnpm dlx create-plasmo@latest --ts`
  - [x] Confirm `/popup`, `/options`, `/background` entry points
  - [x] Run `pnpm dev` and load *Unpacked Extension* in Chrome → verify HMR
- [x] **Tailwind design system**
  - [x] `pnpm add -D tailwindcss postcss autoprefixer`
  - [x] `npx tailwindcss init -p`
  - [x] Configure brand palette & `darkMode:'class'`
  - [x] Import `@tailwind base/components/utilities` in `src/styles.css`
- [x] **Lint / format / hooks**
  - [x] `pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks`
  - [x] `pnpm add -D prettier eslint-config-prettier`
  - [x] `pnpm dlx husky-init && pnpm husky add .husky/pre-commit "pnpm run lint && pnpm run format"`
- [x] **Local data layer**
  - [x] `pnpm add dexie`
  - [x] Create `src/lib/db.ts` with `actions` & `settings` tables
- [x] **Unit + e2e tests**
  - [x] `pnpm add -D vitest @testing-library/react jsdom`
  - [x] `pnpm add -D playwright`
  - [x] Write dummy Vitest spec for Popup render
  - [x] Write Playwright "open-popup" smoke test
- [x] **CI (GitHub Actions)**
  - [x] `.github/workflows/ci.yml` — lint, test, `plasmo build`
  - [x] Cache `~/.pnpm-store`
- [x] **Performance budget**
  - [x] Fresh clone → `pnpm dev` HMR < 2 min on Intel i3

---

## Phase 1 · Shortcut engine + type-ahead (Week 1 → 3)

> Goal: keyboard palette **with live suggestions** for both *Web Search* and *Tool Search*.

### 1.1 — Core keyboard layer
- [x] **Action type**
  - [x] `src/types/action.ts` (`id`,`name`,`handler`,`shortcut`,`tags`)
- [x] **Hot-key listener**
  - [x] `pnpm add hotkeys-js`
  - [x] Hook into `/background` Service Worker
  - [x] Default combos  
        - [x] `Ctrl Space` → Web-search palette  
        - [x] `Ctrl Alt Space` → Tool-finder palette
- [x] **Persist & sync shortcuts**
  - [x] Dexie CRUD
  - [x] Sync to `chrome.storage.sync`

### 1.2 — Universal *CommandPalette* component
- [x] `pnpm add fuse.js`
- [x] Build `components/CommandPalette.tsx`
  - [x] Debounce input (300 ms)
  - [x] Arrow-key navigation (↑/↓) & active highlight
  - [x] `Esc` closes, `Enter` selects
  - [x] Re-usable for *web* and *tool* mode

### 1.3 — Web-search type-ahead
- [x] **Search-engine settings panel**
  - [x] Support **Google**, **DuckDuckGo**, **Bing**
  - [x] Store engine choice & API endpoint in `settings`
- [x] **Suggestion fetchers**  
  *(no API-key routes, CORS-friendly)*  
  - [x] Google: `https://suggestqueries.google.com/complete/search?client=chrome&q={q}`  
  - [x] DuckDuckGo: `https://ac.duckduckgo.com/ac/?q={q}&type=list`  
  - [x] Bing: `https://api.bing.com/osjson.aspx?query={q}`
- [x] **Open-tab handler**
  - [x] On `Enter`, open new tab → `${engine.searchUrl}?q=${encodeURIComponent(choice)}`
  - [x] Fallback: open raw user text if no suggestion chosen
- [ ] **Playwright tests**
  - [ ] Stub fetch → return fixture suggestions
  - [ ] Assert ↑/↓ cycles through list, `Enter` launches correct tab

### 1.4 — Tool-finder type-ahead
- [x] Fuse search over Dexie `actions`
- [x] Show top 6 actions as suggestions
- [x] Selecting result executes action handler
- [ ] **Regression tests**
  - [ ] Simulate 30 random shortcuts, assert no browser collisions
- [ ] **Perf gate**
  - [ ] p90 palette open < 120 ms (Intel i3)

---

## Phase 2 · Utility toolkit (Week 3 → 10)

### Colour Picker (Week 3)
- [ ] Wrap native `window.EyeDropper`
- [ ] Fallback to `iro.js`
- [ ] Save last 20 colours in Dexie

### File → PDF (Week 4)
- [ ] `pnpm add react-dropzone pdf-lib tesseract.js`
- [ ] Drag-and-drop area
- [ ] Merge / split
- [ ] OCR toggle

### Image Cropper (Week 4-5)
- [ ] `pnpm add react-easy-crop`
- [ ] Canvas export via `toBlob`
- [ ] Mobile pinch-zoom support

### Video/Audio Cropper (Week 5-6)
- [ ] `pnpm add @ffmpeg/ffmpeg`
- [ ] Worker via **Comlink**
- [ ] Progress bar UI

### Background Removal (Week 6-7)
- [ ] Add U²-Net ONNX → `public/models`
- [ ] Infer with `onnxruntime-web`
- [ ] Preview & export PNG

### Watermark In-paint (Week 7-8)
- [ ] Brush canvas
- [ ] Load LaMa WASM model
- [ ] Undo/redo stack

### Unified UX polish (Week 8-9)
- [ ] Shared header/footer layout
- [ ] Tailwind `dark:` classes
- [ ] Stub i18n (react-i18next, en keys)

### QA & Closed-Beta (Week 9-10)
- [ ] Playwright flow: file → crop → OCR → save PDF
- [ ] `pnpm run build` → `.crx`
- [ ] Ship to 20 beta-testers
- [ ] Collect telemetry (daily tool invocations)

---

## Completion gates

- [ ] p90 command-palette open < 120 ms
- [ ] < 2 % unhandled errors in Sentry
- [ ] ≥ 1 k daily tool invocations during beta
- [ ] ≥ 60 % beta users launch ≥ 3 different tools
