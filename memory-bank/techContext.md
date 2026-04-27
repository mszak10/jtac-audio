# Tech Context: jtac-audio

## Platform & Runtime

- **Target browser:** Chromium-based (Chrome, Edge, Brave, Arc). No Firefox / Safari support.
- **Manifest version:** Manifest V3.
- **Distribution:** Local unpacked install in `chrome://extensions` for MVP. Possibly Chrome Web Store later.
- **OS:** Cross-platform (Win/Mac/Linux); the extension itself is OS-agnostic — only Chrome matters.

## Technology Stack

### Build & tooling
- **Vite** — build tool, dev server, HMR.
- **`@crxjs/vite-plugin`** — Vite plugin for Chrome extension MV3 development. Handles the manifest, content script bundling, HMR for the popup, and the offscreen document pipeline.
- **TypeScript** (strict mode) — all source code is TS.
- **Node.js 20+ LTS** — required by Vite and the plugin toolchain.
- **pnpm or npm** — package manager. Either is fine; pick one and stick with it.

### Extension surfaces
- **Service worker (`background.ts`)** — coordinates state, listens for popup messages, opens/closes the offscreen document, manages per-tab state in memory.
- **Offscreen document (`offscreen.html` + `offscreen.ts`)** — long-lived page hosting the `AudioContext`. Receives `MediaStream`s from `chrome.tabCapture` and applies channel routing.
- **Popup (`popup.html` + React app in `popup/`)** — toolbar UI.
- **No content scripts needed** for the MVP — `chrome.tabCapture` works from the service worker / offscreen, not from page context.

### UI stack (popup only)
- **React 18+** — popup UI.
- **Tailwind CSS v3.x** — styling. **Do NOT use v4 alpha/beta.**
- **shadcn/ui** — component primitives (Button, RadioGroup, etc.) layered on Radix + Tailwind.
- **lucide-react** — icons.

### Audio stack
- **`chrome.tabCapture` API** — to get a `MediaStream` of a tab's audio.
- **Web Audio API** in the offscreen document:
  - `AudioContext` (one global instance, reused).
  - `MediaStreamAudioSourceNode` per captured tab.
  - `ChannelSplitterNode(2)` to separate left/right.
  - `GainNode` per channel (gain = 0 to mute, 1 to pass).
  - `ChannelMergerNode(2)` to recombine.
  - Output to `audioContext.destination`.

### State
- In-memory `Map<tabId, RoutingState>` in the service worker.
- Cleared on tab close (`chrome.tabs.onRemoved`) and tab navigation (`chrome.tabs.onUpdated` with full reload).
- No persistence in MVP. No `chrome.storage` writes.

### Testing
- **Vitest** for unit tests on pure logic (state reducers, routing helpers, channel math).
- **Manual / by-ear testing** for the audio pipeline itself — automated audio testing in a real browser is not worth the effort at this scale.
- Target: 80% coverage on pure-logic modules. Audio pipeline and Chrome API integration are exempt — verified manually.

## Project Structure

```
jtac-audio/
├── memory-bank/             # Documentation (this folder)
├── public/                  # Static assets (icon files, etc.)
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── background/
│   │   └── background.ts    # Service worker entry
│   ├── offscreen/
│   │   ├── offscreen.html
│   │   └── offscreen.ts     # AudioContext host
│   ├── popup/
│   │   ├── popup.html
│   │   ├── main.tsx         # React entry
│   │   ├── Popup.tsx        # Root popup component
│   │   └── components/      # shadcn/ui components used here
│   ├── shared/
│   │   ├── messages.ts      # Typed message contracts between surfaces
│   │   ├── routing.ts       # Pure logic: routing state, channel math
│   │   └── types.ts         # Shared TypeScript types
│   └── styles/
│       └── globals.css      # Tailwind base + tokens
├── manifest.config.ts       # Manifest V3 config consumed by @crxjs/vite-plugin
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── package.json
└── README.md
```

## Manifest V3 Permissions Needed

- `tabCapture` — to capture tab audio.
- `offscreen` — to spawn the offscreen document.
- `activeTab` — to identify the currently active tab from the popup.
- `tabs` — to read tab metadata and listen for close/navigate events.
- No host permissions required — `chrome.tabCapture` operates per-tab via user gesture, not via URL match.

## Development Environment

### Prerequisites
- Node.js 20+ (LTS).
- Chrome (or Chromium fork) with developer mode enabled.
- A pair of stereo headphones for testing (you cannot test this without them).

### Initial setup commands
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D @crxjs/vite-plugin@latest
npm install -D tailwindcss@3 postcss autoprefixer
npm install -D vitest @types/chrome
npx tailwindcss init -p
npx shadcn@latest init
```

### Daily commands
```bash
npm run dev         # Vite dev server with HMR for the extension
npm run build       # Production build → dist/
npm run test        # Vitest run
npm run test:watch  # Vitest watch mode
npx tsc --noEmit    # Fast type check, run before build
```

### Loading the extension in Chrome
1. `npm run build` (or `npm run dev` for HMR).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked**.
5. Select the `dist/` folder.
6. The extension icon appears in the toolbar.

For dev with HMR, use `npm run dev` and load the `dist/` it produces — the plugin keeps it updated.

## Error Checking Sequence

Before declaring a feature done:
1. `npx tsc --noEmit` — catches type errors fastest.
2. `npm run test` — unit tests for pure logic.
3. `npm run build` — final verification that the extension bundles cleanly.
4. **Manual test in Chrome with stereo headphones** — by ear, the only real test.

## Version Stability Rules

- Use **stable** versions only. No `@beta`, no `@alpha`, no `@next`.
- Tailwind: **v3.x** only. v4 is not stable enough yet.
- React: latest stable LTS (18+ or 19 once truly stable).
- `@crxjs/vite-plugin`: pinned to a known-working stable version. Verify Manifest V3 support.

## Environment Variables

None required for MVP. The extension is self-contained, no API keys, no backend.

If something is added later (e.g., an opt-in error reporter), it goes in a `.env.local` (git-ignored) and is read via `import.meta.env.VITE_*`.

## Performance Targets

- **Audio latency added by routing:** under 50ms (one Web Audio graph hop). Verify by ear — if it sounds out of sync, investigate.
- **Popup open time:** under 200ms.
- **Memory footprint:** flat over hours of use. No growth from leaking `AudioContext`s or `MediaStream`s.
- **CPU at idle:** near zero. No polling loops.

## Browser API Gotchas (known landmines)

- **Service workers can't host Web Audio reliably** in MV3 — they get suspended. Use an offscreen document.
- **`chrome.tabCapture` requires a user gesture** on the target tab. The toolbar click counts as a gesture.
- **Capturing a tab mutes the original tab playback unless you explicitly route the captured stream back to the speakers.** This is the whole reason for the Web Audio pipeline — without it, the tab goes silent.
- **DRM-protected audio cannot be captured.** Netflix, Spotify Web Player, etc. will fail. Detect and surface this clearly.
- **`AudioContext` autoplay restrictions** — must be created or resumed in response to a user gesture. The popup click triggers it.
- **Sample rate mismatches** between the captured stream and the `AudioContext` can introduce artifacts. Create the `AudioContext` matching the stream's sample rate when possible.

## Coding Conventions

- **Strict TypeScript.** No `any` unless escaping a Chrome API typing gap, with a `// eslint-disable-next-line` comment explaining why.
- **No comments explaining what code does.** Only why-comments for non-obvious constraints (e.g., a Chrome API quirk).
- **Naming:** `camelCase` for variables and functions, `PascalCase` for React components and types, `SCREAMING_SNAKE` for true constants.
- **Functional React.** Hooks only. No class components.
- **Pure logic in `shared/`** — anything that doesn't touch a Chrome API or the DOM goes in a unit-testable module.
- **Message passing** between extension surfaces uses typed contracts in `shared/messages.ts`. No untyped string events.
