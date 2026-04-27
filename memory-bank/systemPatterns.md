# System Patterns: jtac-audio

## Architecture Overview

The extension has three runtime surfaces, each with a distinct role. They communicate via typed `chrome.runtime` messages.

```
┌───────────────────────┐        ┌───────────────────────┐
│   Popup (React)       │        │  Active Tab           │
│   - shows current     │        │  (audio source)       │
│     state for active  │        │                       │
│     tab               │        └───────────┬───────────┘
│   - emits SET_ROUTING │                    │ chrome.tabCapture
└───────────┬───────────┘                    │
            │ message                        ▼
            ▼                    ┌───────────────────────┐
┌───────────────────────┐        │  Offscreen Document   │
│  Service Worker       │◄──────►│  - hosts AudioContext │
│  (background.ts)      │        │  - splits L/R         │
│  - state: Map<tabId,  │        │  - merges & outputs   │
│       RoutingState>   │        │    to speakers        │
│  - opens/closes       │        └───────────────────────┘
│    offscreen doc      │
│  - tab lifecycle      │
└───────────────────────┘
```

### Why three surfaces

- The **popup** is ephemeral (closes when it loses focus) — bad place for persistent state.
- The **service worker** is the only surface that can listen to tab lifecycle events globally — but it can't host Web Audio reliably (gets suspended).
- The **offscreen document** is a stable, hidden page that *can* host Web Audio. Its only purpose is to keep the audio graph alive.

This three-surface dance is mandated by Manifest V3. Don't try to collapse it.

## Component Structure & Relationships

```
src/
├── background/
│   └── background.ts        # Service worker. Owns per-tab state. Bridges popup ↔ offscreen.
├── offscreen/
│   ├── offscreen.html       # Minimal HTML host page.
│   └── offscreen.ts         # AudioContext + per-tab audio graph manager.
├── popup/
│   ├── popup.html
│   ├── main.tsx             # React root.
│   ├── Popup.tsx            # Top-level UI.
│   └── components/          # shadcn/ui RadioGroup, Button, etc.
├── shared/
│   ├── messages.ts          # Discriminated union of message types.
│   ├── routing.ts           # Pure: RoutingMode, gain math, state reducer.
│   └── types.ts             # Shared types: TabId, RoutingMode, RoutingState.
└── styles/
    └── globals.css          # Tailwind directives + design tokens.
```

### Distinction: pages vs components

In a Chrome extension, "pages" are extension surfaces (popup, offscreen). They live at top level. "Components" under `popup/components/` are reusable React UI pieces.

### File naming
- React components: `PascalCase.tsx` (`Popup.tsx`, `RoutingControl.tsx`).
- Plain TypeScript modules: `camelCase.ts` (`routing.ts`, `messages.ts`).
- Extension entry points: lowercase to match the manifest convention (`background.ts`, `offscreen.ts`).

## Core Patterns

### Pattern: typed message contracts

All inter-surface communication uses a discriminated union defined in `shared/messages.ts`.

```ts
export type Message =
  | { type: 'GET_TAB_STATE'; tabId: number }
  | { type: 'SET_ROUTING'; tabId: number; mode: RoutingMode }
  | { type: 'TAB_CLOSED'; tabId: number }
  | { type: 'OFFSCREEN_READY' };

export type RoutingMode = 'stereo' | 'left' | 'right';
```

Every `sendMessage` and `onMessage` handler is typed against this union. No string-typed events.

### Pattern: state lives in the service worker

The service worker owns the authoritative `Map<tabId, RoutingMode>`. The popup queries it on open. The offscreen document doesn't store state — it reacts to messages.

This single-source-of-truth avoids reconciliation between three surfaces.

### Pattern: offscreen document is a slave

The offscreen document does not make decisions. It receives a `SET_ROUTING` message with a `tabId` and `mode`, and it does the audio plumbing. It does not store state, it does not initiate communication.

If the service worker dies and restarts, it can rebuild the offscreen state by replaying its `Map`.

### Pattern: pure logic in `shared/routing.ts`

Anything that doesn't touch Chrome APIs or the DOM goes here. Reducers, gain calculations, validation. This is the only directory with meaningful unit-test coverage.

```ts
// example
export function gainsForMode(mode: RoutingMode): { left: number; right: number } {
  switch (mode) {
    case 'stereo': return { left: 1, right: 1 };
    case 'left':   return { left: 1, right: 0 };
    case 'right':  return { left: 0, right: 1 };
  }
}
```

## Audio Pipeline (the heart of the extension)

Per routed tab, the offscreen document builds this graph:

```
chrome.tabCapture.getMediaStreamId(tabId)
  → navigator.mediaDevices.getUserMedia({ audio: { mandatory: { ... streamId } } })
  → MediaStream
  → MediaStreamAudioSourceNode
  → ChannelSplitterNode(2)
       ├── output[0] (left)  → GainNode(left.gain)  ┐
       └── output[1] (right) → GainNode(right.gain) ┤
                                                     ├→ ChannelMergerNode(2)
                                                     │     → audioContext.destination
```

Setting `mode = 'left'` means `right.gain.value = 0`, `left.gain.value = 1`. Setting `mode = 'right'` is the inverse. Setting `mode = 'stereo'` means both gains = 1 (or, alternatively, tear down the graph and let the original tab audio play untouched — see "Stereo means no graph" below).

### Stereo means no graph

When the user picks **Stereo**, we want the tab's normal audio to play. There are two ways:

1. Keep the graph up with both gains = 1.
2. Tear the graph down and stop capture; let the tab play natively.

Option 2 is preferred — capturing a tab adds latency and complexity even when we're not modifying anything. Stop capture when mode returns to stereo.

### Cleanup is critical

Every captured `MediaStream` must be:
- `track.stop()`'d on every track,
- disconnected from all Web Audio nodes,
- the nodes themselves dereferenced.

Failure to clean up = leaking audio contexts and silent tabs.

## Design Patterns & UI Guidelines

The popup is the only UI surface. It is small (≈300×220 px) and minimal.

- **Tailwind CSS** for all styling. Stick to design tokens.
- **shadcn/ui** primitives for the radio group / segmented control and any buttons.
- **Framer Motion** is overkill for this UI — skip unless a transition genuinely helps. Reach for it only if needed.
- **Lucide React** for the headphone / speaker / channel icons.
- **No dark/light toggle.** Pick one tasteful default scheme and ship.
- **High contrast text.** No gradients on labels or critical state indicators.
- **Visible active state.** The currently selected mode must be unmistakably highlighted.
- **Disabled state for unsupported tabs.** If a tab can't be captured (DRM, system page, no audio detected), show a clear inline message, not a silent failure.

## Code Quality Standards

- Functional React, hooks only. No class components.
- Strict TypeScript. No `any` outside Chrome API typing gaps (which must be commented).
- Names are self-documenting; comments only explain non-obvious *why*.
- No partial implementations. No `TODO` placeholders shipped to main.
- Small files. If a file passes ~200 lines, look for a split.
- Imports grouped: external → internal → relative. Trim unused.

## Security & Validation

- All `chrome.runtime.onMessage` handlers validate the message type against the discriminated union before dispatch.
- No user input is rendered as HTML — the only user input is the routing mode click, which is a closed enum.
- Tab titles displayed in the popup are rendered as text, never `dangerouslySetInnerHTML`.
- No network calls. No third-party scripts loaded at runtime.
- Manifest permissions are kept to the minimum required.

## Error Handling

- **Capture failure (DRM, no audio, permission denied):** caught at the `getUserMedia` boundary, surfaced to the popup as a clear message ("This tab can't be routed — DRM-protected audio."). State for that tab is reset to `stereo`.
- **Offscreen document creation failure:** logged, popup shows a generic "Audio engine unavailable" state.
- **Service worker death mid-operation:** on restart, all per-tab state is gone (acceptable — user can re-toggle). The offscreen document, if still alive, is closed and recreated on next routing request.
- **Don't wrap things in `try/catch` for the sake of it.** Catch where you can do something useful (surface a UI error, clean up resources). Otherwise let it throw and surface in the dev console.
- **Logging:** `console.log` / `console.warn` is fine for an unpacked dev extension. No telemetry.

## Testing Strategy

### Unit tests (Vitest)
- `shared/routing.ts` — gain math, state reducer.
- `shared/messages.ts` — type guards, if any.
- Target 80% coverage on `shared/`.

### Manual tests
- The audio pipeline. Verified by ear with stereo headphones.
- Tab lifecycle: route a tab, close it, ensure no orphan audio context.
- Two-tab scenario: one left, one right, both audible simultaneously, each in its assigned ear.

### What we don't test
- Chrome API integration. Mocking `chrome.tabCapture` is more work than it's worth at this scale; the cost/benefit doesn't justify it. We test logic, not the browser.
