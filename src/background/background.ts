import {
  clearTab,
  createStateMap,
  getMode,
  isRoutingMode,
  requiresCapture,
  setMode,
} from '../shared/routing';
import type { Message, MessageResponse } from '../shared/messages';
import { isMessage } from '../shared/messages';
import type { CaptureError, RoutingMode, TabId } from '../shared/types';

const OFFSCREEN_PATH = 'src/offscreen/offscreen.html';
const OFFSCREEN_REASONS = ['USER_MEDIA'] as unknown as chrome.offscreen.Reason[];

const store = createStateMap();

async function ensureOffscreenDocument(): Promise<void> {
  const existing = await chrome.offscreen.hasDocument?.();
  if (existing) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: OFFSCREEN_REASONS,
    justification:
      'Long-lived AudioContext for routing tab audio to a single stereo channel.',
  });
}

async function captureStreamId(tabId: TabId): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId(
      { targetTabId: tabId },
      (streamId?: string) => {
        if (chrome.runtime.lastError || !streamId) {
          reject(new Error(chrome.runtime.lastError?.message ?? 'no streamId'));
          return;
        }
        resolve(streamId);
      },
    );
  });
}

function classifyError(message: string): CaptureError {
  const m = message.toLowerCase();
  if (m.includes('drm')) return 'drm-protected';
  if (m.includes('permission') || m.includes('denied'))
    return 'permission-denied';
  if (m.includes('no audio')) return 'no-audio';
  if (m.includes('cannot') || m.includes('chrome://') || m.includes('extension'))
    return 'unsupported-tab';
  return 'unknown';
}

async function applyRouting(
  tabId: TabId,
  mode: RoutingMode,
): Promise<MessageResponse> {
  let tab: chrome.tabs.Tab | undefined;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return { ok: false, reason: 'unsupported-tab' };
  }

  if (mode === 'stereo') {
    setMode(store, tabId, 'stereo');
    await chrome.runtime
      .sendMessage({ type: 'SET_ROUTING', tabId, mode: 'stereo' } satisfies Message)
      .catch(() => undefined);
    return { ok: true, mode: 'stereo' };
  }

  // Switching between non-stereo modes reuses the existing capture pipeline
  // — only the channel gains change. Calling getMediaStreamId again on an
  // already-captured tab fails and would otherwise revert the popup to stereo.
  if (!requiresCapture(store, tabId, mode)) {
    setMode(store, tabId, mode, { tabTitle: tab.title, url: tab.url });
    await chrome.runtime
      .sendMessage({ type: 'SET_ROUTING', tabId, mode } satisfies Message)
      .catch(() => undefined);
    return { ok: true, mode };
  }

  try {
    await ensureOffscreenDocument();
    const streamId = await captureStreamId(tabId);
    setMode(store, tabId, mode, { tabTitle: tab.title, url: tab.url });
    await chrome.runtime.sendMessage({
      type: 'SET_ROUTING',
      tabId,
      mode,
      streamId,
    } satisfies Message);
    return { ok: true, mode };
  } catch (err) {
    const reason = classifyError(
      err instanceof Error ? err.message : String(err),
    );
    setMode(store, tabId, 'stereo');
    return { ok: false, reason };
  }
}

chrome.runtime.onMessage.addListener(
  (raw: unknown, _sender, sendResponse: (r: MessageResponse | { mode: RoutingMode }) => void) => {
    if (!isMessage(raw)) return false;

    if (raw.type === 'GET_TAB_STATE') {
      sendResponse({ mode: getMode(store, raw.tabId) });
      return false;
    }

    if (raw.type === 'SET_ROUTING') {
      if (!isRoutingMode(raw.mode)) {
        sendResponse({ ok: false, reason: 'unknown' });
        return false;
      }
      applyRouting(raw.tabId, raw.mode).then(sendResponse);
      return true;
    }

    return false;
  },
);

chrome.tabs.onRemoved.addListener((tabId) => {
  if (clearTab(store, tabId)) {
    chrome.runtime
      .sendMessage({ type: 'TAB_CLOSED', tabId } satisfies Message)
      .catch(() => undefined);
  }
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading' && info.url) {
    if (clearTab(store, tabId)) {
      chrome.runtime
        .sendMessage({ type: 'TAB_CLOSED', tabId } satisfies Message)
        .catch(() => undefined);
    }
  }
});

export {};
