# Product Context: jtac-audio

## Why This Project Exists

Modern computing is multi-stream. A single user often has a meeting, a chat, a livestream, a music player, and a notification source all producing audio simultaneously. The OS audio stack collapses everything into one stereo bus. The result is overlapping audio — two streams competing in both ears, neither intelligible.

Stereo headphones are physically two independent transducers. Each ear can receive a distinct signal. The hardware already supports two parallel audio streams; only the software prevents it.

`jtac-audio` reclaims this latent capability. It treats the two ears as two independent listening surfaces and lets the user assign one tab to each. The user effectively doubles their auditory bandwidth at zero cost — no second device, no second pair of headphones, no virtual audio router.

## Market & Competitive Landscape

### Adjacent solutions

- **VoiceMeeter / VB-Cable (Windows), BlackHole / Loopback (macOS), PulseAudio sinks (Linux)** — OS-level virtual audio routers. Powerful but per-application, not per-tab. All Chrome tabs collapse into one source.
- **OS accessibility settings ("Mono Audio", "Audio balance")** — global. Affects everything, can't be set per-tab.
- **Browser extensions for audio EQ / volume** (Volume Master, Ears, etc.) — manipulate volume or apply EQ, but none expose per-channel routing.
- **Two-device setup** — phone in one ear, laptop in the other. Works but defeats the purpose of one device.

### Where `jtac-audio` fits

It's the only solution that operates at the **per-tab level inside one browser**, with **no OS-level setup**, no driver install, and **zero configuration** beyond clicking a toolbar button. That is the wedge.

### Is this a product or a tool?

It's a tool. There is no monetization plan, no roadmap to a SaaS, no upsell. The goal is a clean, free, ideally open-source utility that does its one thing well. Success looks like the developer (and maybe a handful of others) using it daily because it just works.

## Specific Problems Being Solved

### Problem 1: The "meeting + livestream" problem
A trader, analyst, or operator wants to keep an ear on a livestream (earnings call, sports, news) while attending a Zoom meeting. Today both audio streams play into both ears, neither comprehensible. With `jtac-audio`, livestream → right ear, meeting → left ear.

### Problem 2: The "two podcasts" problem
A learner wants to listen to two long-form audio sources to compare them, or a parent wants to keep a kid's content audible in one ear while taking a call in the other. Same mechanic.

### Problem 3: The "ambient + focus" problem
Lo-fi music in one ear, the actual lecture/tutorial in the other. The ambient track stays at low volume in the off-ear; the primary content has the dominant ear.

### Problem 4: The "monitoring" problem
A streamer or podcaster wants to keep a chat / Discord on one ear while their primary content plays in the other. Today they need a second device or a hardware mixer.

## User Experience Goals & Principles

1. **Zero-config.** Install and it works. No accounts, no settings page on first run.
2. **One click to route.** From "I want this tab on the left" to it being on the left should be a single click in the popup.
3. **Reversible.** Always one click back to normal stereo. No dead ends.
4. **Honest defaults.** Default is unchanged stereo. The extension does nothing unless explicitly told to.
5. **Visible state.** The popup makes the current state of the current tab obvious at a glance.
6. **Quiet failure.** If a tab can't be captured (DRM, system tab), say so plainly. Don't pretend it worked.
7. **Don't break the audio.** If the extension fails or is disabled, the tab's audio must continue normally.

## Non-Goals

- It is not an EQ, not a volume booster, not a mixer.
- It is not a tool for music production or broadcast.
- It does not need to support more than two channels.
- It does not need to remember settings across browser restarts (MVP).
- It does not need to know what's playing or transcribe anything.

## Success Metrics

For a personal tool, success is qualitative:

- **Daily usage by the developer.** If the developer doesn't reach for it daily, the use case wasn't real.
- **Zero perceived audio degradation.** No popping, no latency the user notices, no quality loss.
- **Reliable cleanup.** Long browser sessions don't accumulate dead audio contexts or memory.
- **No surprise breakage.** Updates to Chrome don't silently kill the extension; if they do, the breakage is loud and obvious so it can be fixed.

If the project ever expanded:
- **Number of installs** (if published to Chrome Web Store).
- **Issue reports vs. feature requests ratio** — high feature-request ratio means it works; high issue ratio means it doesn't.

## Vision (informal)

A small, sharp tool. The kind of thing a developer writes once, uses for years, and occasionally points colleagues at when they say "wait, you can do *what*?" If it ever grows, the natural next step is per-domain memory ("always route youtube.com to the right") and possibly a balance slider — but only if the bare binary version proves itself first.
