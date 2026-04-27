# Progress

## Status

**Phase:** Initial scaffold complete. Three surfaces wired end-to-end. Awaiting manual ear verification in Chrome.
**Date:** 2026-04-27.

## What works

- Memory Bank initialized (seven core files).
- Local git repository initialized. No remote configured yet.
- `CLAUDE.md` and prompt-reminder hook script in place.
- Vite + React 18 + TypeScript 5 project scaffolded with `@crxjs/vite-plugin` v2 beta.
- Tailwind CSS v3 configured with project design tokens (ink palette, accent, left/right channel colors).
- `manifest.config.ts` declares MV3 with permissions `tabCapture`, `offscreen`, `activeTab`, `tabs`.
- `src/shared/`: types, typed message union, pure routing logic (gain math + state map).
- `src/background/background.ts`: state map, message routing, offscreen-doc lifecycle, tabCapture stream-ID acquisition, capture-error classification, tab-close/reload cleanup.
- `src/offscreen/`: `AudioContext` host with per-tab `MediaStreamSource → ChannelSplitter → GainNode×2 → ChannelMerger → destination` graph and clean teardown.
- `src/popup/`: React popup with three-way segmented control (`RoutingControl`), reads current state on open, sends `SET_ROUTING` on click, renders capture errors.
- `npx tsc -b`: clean.
- `npm test`: 19/19 passing on `src/shared/routing.ts`.
- `npm run build`: produces `dist/` with valid `manifest.json`, bundled popup, offscreen, and background service worker.

## What's left to build

### Verification (the actual proof)
- [ ] Manual ear test — load `dist/` in Chrome, route a YouTube tab to **Left only**, confirm audio plays only in the left ear.
- [ ] Two-tab test — Tab A → Left, Tab B → Right; both audible simultaneously, one per ear.
- [ ] Stereo restore — flip a routed tab back to **Stereo**, confirm normal playback.
- [ ] Cleanup — close a routed tab, confirm no orphan audio.
- [ ] DRM error path — try Spotify Web / Netflix; confirm clear error in popup.

### Polish (post-verification)
- [x] Icons (16/48/128 PNG) generated programmatically and wired into the manifest. Replace with a designed asset before public listing if desired.
- [x] Manifest hardened for store submission (`homepage_url`, `author`, `minimum_chrome_version: 116`, `short_name`, `default_icon`).
- [x] Privacy policy (`PRIVACY.md`) authored.
- [x] Store listing copy (`STORE_LISTING.md`) authored — title, descriptions, single-purpose, permission justifications, review notes, screenshot plan.
- [x] `npm run package` script — builds `dist/` and produces `jtac-audio-v<version>.zip` ready for Chrome Web Store upload.
- [ ] Optional: shadcn/ui integration if richer UI primitives become useful.
- [ ] Optional: lucide-react icons for the segmented-control buttons.
- [ ] Optional: visual indicator on the toolbar icon when a tab is routed (badge text "L" / "R").

### Future (post-MVP)
- [ ] Per-domain memory ("always route youtube.com to right").
- [ ] Cross-session persistence via `chrome.storage`.
- [ ] Balance slider (continuous L/R rather than binary).
- [x] Chrome Web Store **packaging** (zip ready). Submission itself still requires: dev-account registration, screenshots, hosted privacy URL, and review.

## Known issues

None — no code yet.

## Decision Log (append-only)

### 2026-04-27 — Stack chosen
Vite + `@crxjs/vite-plugin` + TypeScript + React + Tailwind v3 + shadcn/ui.
**Rationale:** `@crxjs/vite-plugin` is the most maintained MV3 toolchain with HMR for the popup. React + Tailwind + shadcn/ui matches the standard project handbook and gives a polished popup with minimal effort. Tailwind v3 (not v4) for stability.

### 2026-04-27 — Three-surface architecture
Service worker (state + lifecycle) + offscreen document (`AudioContext`) + popup (UI).
**Rationale:** MV3 service workers can't host Web Audio reliably (they suspend). The offscreen document is the official escape hatch. The popup is too ephemeral to own state. Each surface gets exactly one responsibility.

### 2026-04-27 — No persistence in MVP
State lives in the service worker's in-memory `Map<tabId, RoutingMode>` and is wiped on tab close / browser restart.
**Rationale:** Per-domain memory and persistence are real features but they're v2. MVP is "make the audio routing work at all." Adding persistence now adds surface area without proving the core mechanism.

### 2026-04-27 — Stereo mode = full teardown
When the user reverts a tab to **Stereo**, we stop the capture and tear down the audio graph rather than keeping a pass-through graph at gain=1.
**Rationale:** Even a pass-through graph adds latency and CPU. Stereo is the default, so the cheapest implementation is "do nothing." Capture only when needed.

### 2026-04-27 — No content scripts
`chrome.tabCapture` works from the offscreen / service worker without injecting a content script.
**Rationale:** Fewer permissions, simpler architecture, no per-page injection cost.

### 2026-04-27 — `@crxjs/vite-plugin` v2 beta accepted
Pinned to `^2.0.0-beta.34`. The handbook prefers stable versions, but `@crxjs/vite-plugin` has no stable v2 release and v1 doesn't support MV3 properly.
**Rationale:** Pragmatic exception. The MV3 toolchain story is the v2 line; everyone using crxjs for MV3 is on the beta. Pin tightly and re-evaluate on stable release.

### 2026-04-27 — shadcn/ui not installed in initial scaffold
The popup is a single screen with three buttons; hand-written Tailwind is simpler than the shadcn install + RadioGroup primitive.
**Rationale:** YAGNI. Add shadcn when a real component (Dialog, Combobox, etc.) is needed. The decision is reversible.

### 2026-04-27 — Offscreen reasons as runtime string
`chrome.offscreen.Reason` is exposed as a TypeScript enum, but the chrome runtime accepts the string `'USER_MEDIA'` directly. We pass the string and cast through `chrome.offscreen.Reason[]` to satisfy the type system without forcing the consumer to import the enum.
**Rationale:** Avoids dragging the enum import into a service-worker entry point that may be evaluated before chrome APIs are typed; the cast is local and commented in `background.ts`.
