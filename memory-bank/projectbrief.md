# Project Brief: jtac-audio — Per-Tab Stereo Channel Router (Chrome Extension)

## Project Overview

`jtac-audio` is a Chrome browser extension that lets a user route the audio output of any individual browser tab to **only the left** or **only the right** stereo channel of their output device. The default behavior is unchanged stereo. The user can selectively force any tab to mono-left or mono-right.

The motivating use case: listening to two different audio sources simultaneously on a single pair of headphones. Example — a meeting on one tab routed to the left ear, a podcast on another tab routed to the right ear. The user effectively gets two independent audio streams, one per ear, mixed by the OS into a single stereo output.

This is a **single-developer side project / utility extension** rather than a commercial product. Scope is intentionally tight: a one-purpose tool that does its one thing reliably.

## Problem Statement

People who multitask with audio (analysts, traders, gamers, parents on calls, anyone monitoring a livestream while in a meeting) often want to hear two things at once. The OS only gives them one stereo output. Today they either:

- **Use two devices** — laptop on speakers + phone on headphones. Awkward, requires juggling.
- **Use a virtual audio router** (VoiceMeeter, BlackHole, Loopback) to split per-app, but Chrome is one app, so all tabs collapse into one output.
- **Live with audio collisions** — both streams play overlapping into both ears, neither intelligible.

There is no built-in way in Chrome (or any browser) to say "this tab goes left, that tab goes right." This extension fills that gap.

The pain is small per occurrence but happens daily for the target user. The cost of NOT solving it is constant low-grade friction and lost productivity from re-listening.

## Target Users

### Primary: The Power Multitasker
- **Demographics:** Desk worker, age 25–55, daily Chrome user, often wearing headphones.
- **Behavior:** Frequently has multiple tabs producing audio (meeting + livestream, music + tutorial, two podcasts at different speeds).
- **Goal:** Hear both streams clearly without one drowning the other; instantly toggle which ear gets which tab.
- **Technical comfort:** High enough to install an unpacked extension, low patience for setup. Wants it to just work.

### Secondary: The Curious Tinkerer
- **Demographics:** Developer or hobbyist who saw the use case and wants to try it.
- **Behavior:** Will install once, play with it, keep it if it works.
- **Goal:** Working demo of the concept, ideally open-source so they can read the code.

There is no separate admin role, no accounts, no backend.

## User Flows

### Flow 1: First-time install
1. User loads the unpacked extension in `chrome://extensions` (developer mode).
2. Extension icon appears in the toolbar.
3. Default state: every tab plays normal stereo. Extension does nothing until the user opts in per tab.

### Flow 2: Route the active tab to one ear
1. User is on a tab playing audio (e.g., a YouTube video).
2. User clicks the extension icon in the toolbar.
3. Popup opens showing the current tab's title and three options:
   - **Stereo** (default, no routing)
   - **Left only**
   - **Right only**
4. User clicks **Left only**.
5. Audio from this tab is now routed to the left channel only. Right channel is silent for this tab.
6. Popup closes (or stays open — user choice).

### Flow 3: Combine two tabs into a stereo pair
1. Tab A: meeting → user sets to **Left only**.
2. Tab B: podcast → user sets to **Right only**.
3. User now hears the meeting in their left ear and the podcast in their right ear.

### Flow 4: Reset a tab to normal
1. User opens the popup while on a routed tab.
2. Popup shows the current state (e.g., **Left only** is highlighted).
3. User clicks **Stereo** to revert.
4. Audio returns to normal stereo for that tab.

### Flow 5: Tab closes / navigates
1. When the tab is closed or navigated away, the routing state for that tab is discarded.
2. No persistence across sessions in the MVP — fresh state every browser launch.

## Feature Specifications

### F1: Toolbar popup UI
- One small popup window opened by clicking the toolbar icon.
- Shows: current tab title (truncated), current routing state.
- Three clearly labeled controls: **Stereo**, **Left only**, **Right only**. Visual indication of which is active.
- Optional: tiny visual meter or static stereo-field icon for clarity.

### F2: Per-tab audio capture and routing
- When a non-stereo mode is selected for a tab, capture that tab's audio stream via `chrome.tabCapture` (or equivalent MV3-compatible API).
- Pipe the captured `MediaStream` through the **Web Audio API** in an offscreen document.
- Use a `ChannelSplitterNode` + `ChannelMergerNode` (or a `GainNode` per channel) to zero out one channel.
- Route the processed stream back to the speakers via an `AudioContext` destination, while muting the original tab playback to avoid double-audio.

### F3: State management
- Track per-tab routing state in memory (background service worker).
- Keyed by `tabId`. Cleared on tab close.
- No `chrome.storage` persistence in MVP. Reset on browser restart.

### F4: Active-tab detection
- Popup must reflect the state of the currently active tab when opened.
- When user changes routing, update both the in-memory state and the active processing pipeline.

### F5: Clean teardown
- When user reverts to **Stereo** or closes the tab, stop the capture stream, disconnect Web Audio nodes, and free resources.
- No orphan `AudioContext`s, no memory leaks across long sessions.

## Out of scope for MVP

- Persistence across browser restarts.
- Per-domain rules ("always route youtube.com left").
- Volume balancing between the two routed tabs.
- More than two channels (5.1, 7.1).
- Cross-fade / mix levels — it's binary on/off per channel.
- Firefox / Safari support — Chromium-based browsers only.
- Chrome Web Store publication — local-install only for now.
- Telemetry, analytics, accounts.

## Technical Approach (Summary — see `techContext.md` for detail)

- **Manifest V3** Chrome extension.
- **TypeScript** throughout.
- **Vite** + `@crxjs/vite-plugin` for build, HMR, and packaging.
- **React + Tailwind CSS + shadcn/ui** for the popup UI.
- **Offscreen document** to host the long-lived `AudioContext` (service workers can't host Web Audio reliably).
- **`chrome.tabCapture`** for audio access; **Web Audio API** for channel manipulation.

## Constraints

### Technical
- Manifest V3 service workers are short-lived and cannot host Web Audio. Must use an **offscreen document**.
- `chrome.tabCapture` requires an active user gesture to start capture on a tab.
- DRM-protected audio (e.g., some streaming services) cannot be captured. This is a hard browser limitation — document it, don't fight it.
- Routing introduces some latency (one Web Audio graph hop). Should be sub-50ms; verify on real hardware.

### Timeline
- Personal project. No hard deadline. Aim for a working MVP within a single focused build session.

### Distribution
- Local unpacked install only for MVP. Chrome Web Store submission is a possible later step.

## Success Criteria

The MVP is done when:
1. Loading the unpacked extension in Chrome works without errors.
2. Clicking the toolbar icon on an audio-playing tab opens a popup with three options.
3. Selecting **Left only** or **Right only** demonstrably routes audio to that channel only (verified by ear with stereo headphones).
4. Two different tabs can be routed to opposite channels and both play simultaneously, one per ear.
5. Reverting to **Stereo** restores normal playback.
6. Closing a tab cleans up its audio pipeline.
