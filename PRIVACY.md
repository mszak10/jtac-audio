# Privacy Policy — jtac-audio

**Last updated:** 2026-04-27

This is the privacy policy for the **jtac-audio** Chrome extension.

## Summary

**jtac-audio does not collect, store, transmit, or sell any personal data.** Everything the extension does happens locally in your browser. Nothing is sent over the network.

## What the extension does

When you click the toolbar icon and choose **Left only** or **Right only**, the extension:

1. Asks Chrome for a media stream of the active tab's audio (via `chrome.tabCapture`).
2. Routes that stream through the Web Audio API to silence one stereo channel.
3. Sends the modified audio to your speakers/headphones.

The stream is processed in real time. It is never written to disk, never recorded, never sent anywhere.

## Permissions and why they exist

| Permission | Why we need it |
|---|---|
| `tabCapture` | Required to obtain a `MediaStream` of the active tab's audio so it can be re-routed through Web Audio. |
| `offscreen` | Manifest V3 service workers cannot host a long-lived `AudioContext`. The offscreen document hosts the audio graph. |
| `activeTab` | Identifies the tab you are currently viewing when you click the toolbar icon. |
| `tabs` | Lets the extension detect when you close or reload a routed tab so it can clean up that tab's audio pipeline. |

The extension requests **no host permissions**. It does not read, modify, or transmit page content. It does not track which sites you visit.

## Data we collect

**None.** Specifically:

- No personal information (name, email, address, etc.).
- No authentication information (credentials, tokens, OAuth grants).
- No financial information (payment cards, account numbers).
- No health information.
- No personal communications (emails, messages, chats).
- No location data.
- No web history or browsing activity.
- No user-typed input or click streams.
- No analytics, telemetry, crash reports, or usage statistics.

The audio captured from a tab is processed in memory and discarded the moment routing is disabled or the tab closes.

## Data we share

**None.** Because we do not collect any data, there is nothing to share. We do not sell, transfer, or disclose user data to third parties for any purpose.

## Data retention

There is nothing to retain. Per-tab routing state lives only in the extension's memory and is cleared when:

- You set the tab back to **Stereo**.
- The tab is closed.
- The tab navigates to a new page.
- The browser is restarted.

## Third-party services

The extension uses no third-party services, no analytics SDKs, no advertising networks, and no remote code. All code runs locally and is bundled into the extension at build time.

## Children's privacy

The extension does not knowingly collect any data from anyone, including children under 13. Because it collects no data, it complies with COPPA by design.

## Changes to this policy

If a future version of the extension introduces any data-collecting behavior (it currently does not, and there are no plans to), this policy will be updated **before** that version is published, and the change will be summarized in the release notes.

## Contact

Questions about this policy: **mikolaj@mszp.pl**

Source code: <https://github.com/mszak10/jtac-audio>
