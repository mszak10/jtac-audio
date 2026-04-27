import { useCallback, useEffect, useState } from 'react';
import type { Message, MessageResponse } from '../shared/messages';
import type { CaptureError, RoutingMode } from '../shared/types';
import { RoutingControl } from './components/RoutingControl';

interface ActiveTab {
  id: number;
  title: string;
  url: string;
}

const ERROR_COPY: Record<CaptureError, string> = {
  'drm-protected':
    'This tab plays DRM-protected audio (Netflix, Spotify Web, etc.) and cannot be routed.',
  'no-audio': 'No audio detected on this tab. Start playback and try again.',
  'permission-denied':
    'Chrome denied audio capture for this tab. Try clicking the extension again.',
  'unsupported-tab':
    'This tab cannot be captured (system or extension page).',
  unknown: 'Could not start audio capture. Check the console for details.',
};

async function getActiveTab(): Promise<ActiveTab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  return {
    id: tab.id,
    title: tab.title ?? '(untitled)',
    url: tab.url ?? '',
  };
}

async function sendMessage(message: Message): Promise<MessageResponse | { mode: RoutingMode }> {
  return chrome.runtime.sendMessage(message);
}

export function Popup() {
  const [tab, setTab] = useState<ActiveTab | null>(null);
  const [mode, setMode] = useState<RoutingMode>('stereo');
  const [error, setError] = useState<CaptureError | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await getActiveTab();
      if (cancelled || !active) return;
      setTab(active);
      const response = await sendMessage({
        type: 'GET_TAB_STATE',
        tabId: active.id,
      });
      if (cancelled) return;
      if ('mode' in response && !('ok' in response)) {
        setMode(response.mode);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback(
    async (next: RoutingMode) => {
      if (!tab || busy) return;
      const target = next === mode ? 'stereo' : next;
      setBusy(true);
      setError(null);
      const response = await sendMessage({
        type: 'SET_ROUTING',
        tabId: tab.id,
        mode: target,
      });
      setBusy(false);
      if ('ok' in response) {
        if (response.ok) {
          setMode(response.mode);
        } else {
          setError(response.reason);
          setMode('stereo');
        }
      }
    },
    [tab, mode, busy],
  );

  return (
    <div className="w-[320px] p-4">
      <header className="mb-3">
        <h1 className="text-sm font-semibold tracking-wide text-ink-200">
          jtac-audio
        </h1>
        <p className="mt-0.5 truncate text-xs text-ink-400" title={tab?.title}>
          {tab ? tab.title : 'Loading active tab…'}
        </p>
      </header>

      <RoutingControl mode={mode} disabled={!tab || busy} onSelect={onSelect} />

      {error && (
        <p className="mt-3 rounded border border-right/40 bg-right/10 p-2 text-xs leading-snug text-ink-100">
          {ERROR_COPY[error]}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-snug text-ink-500">
        Tip: route one tab to <span className="text-left">left</span>, another to{' '}
        <span className="text-right">right</span>, and listen to both at once.
      </p>
    </div>
  );
}
