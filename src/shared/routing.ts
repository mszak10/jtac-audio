import type { RoutingMode, RoutingState, TabId } from './types';

export interface ChannelGains {
  left: number;
  right: number;
}

export function gainsForMode(mode: RoutingMode): ChannelGains {
  switch (mode) {
    case 'stereo':
      return { left: 1, right: 1 };
    case 'left':
      return { left: 1, right: 0 };
    case 'right':
      return { left: 0, right: 1 };
  }
}

export function isRoutingMode(value: unknown): value is RoutingMode {
  return value === 'stereo' || value === 'left' || value === 'right';
}

export function nextMode(
  current: RoutingMode,
  requested: RoutingMode,
): RoutingMode {
  return current === requested ? 'stereo' : requested;
}

export function createStateMap(): Map<TabId, RoutingState> {
  return new Map();
}

export function setMode(
  store: Map<TabId, RoutingState>,
  tabId: TabId,
  mode: RoutingMode,
  meta?: { tabTitle?: string; url?: string },
): RoutingState {
  if (mode === 'stereo') {
    store.delete(tabId);
    return { tabId, mode: 'stereo', ...meta };
  }
  const next: RoutingState = { tabId, mode, ...meta };
  store.set(tabId, next);
  return next;
}

export function getMode(
  store: Map<TabId, RoutingState>,
  tabId: TabId,
): RoutingMode {
  return store.get(tabId)?.mode ?? 'stereo';
}

export function clearTab(
  store: Map<TabId, RoutingState>,
  tabId: TabId,
): boolean {
  return store.delete(tabId);
}

// True when applying `target` to `tabId` needs a fresh chrome.tabCapture call.
// Stereo never captures. Going stereo → left/right captures. Switching
// between left and right reuses the existing pipeline (just flips gains).
export function requiresCapture(
  store: Map<TabId, RoutingState>,
  tabId: TabId,
  target: RoutingMode,
): boolean {
  if (target === 'stereo') return false;
  return getMode(store, tabId) === 'stereo';
}
