# jtac-audio

Chrome extension that routes any tab's audio to the **left** or **right** channel only, so you can listen to two tabs simultaneously — one in each ear.

## Use case

A meeting in the left ear, a livestream in the right. A podcast in one ear, a tutorial in the other. The browser already drives both channels of your stereo headphones independently; this extension just lets you assign tabs to channels.

## Status

Pre-alpha. Local install only.

## Install (developer mode)

```bash
npm install
npm run build
```

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the `dist/` folder.

## Use

1. Open a tab playing audio (e.g. YouTube).
2. Click the **jtac-audio** toolbar icon.
3. Pick **Left only** or **Right only**.
4. Tab audio is now routed to that ear only. Click **Stereo** to revert.

To listen to two tabs at once, route Tab A to **Left only** and Tab B to **Right only**.

## Limitations

- Chromium browsers only.
- DRM-protected audio (Netflix, Spotify Web, some HBO/Disney content) cannot be captured. The extension surfaces a clear error.
- Per-tab state is not persisted across browser restarts.
- Routing introduces a few milliseconds of latency.

## Develop

```bash
npm run dev          # Vite dev server with HMR; load dist/ in Chrome
npm run build        # Production build → dist/
npm run test         # Vitest unit tests on shared/ logic
npm run typecheck    # tsc -b --noEmit
```

The architecture is a standard MV3 three-surface layout: **service worker** (state + lifecycle) + **offscreen document** (`AudioContext`) + **popup** (UI). See `memory-bank/systemPatterns.md` for detail.

## Contributing

Issues and PRs welcome at <https://github.com/mszak10/jtac-audio>. The project is small on purpose — please read `memory-bank/projectbrief.md` before proposing scope-expanding features.

## License

[MIT](./LICENSE) © 2026 Mikołaj Szpakowski
