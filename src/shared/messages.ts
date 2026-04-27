import type { RoutingMode, TabId, CaptureError } from './types';

export type Message =
  | { type: 'GET_TAB_STATE'; tabId: TabId }
  | { type: 'SET_ROUTING'; tabId: TabId; mode: RoutingMode; streamId?: string }
  | { type: 'TAB_CLOSED'; tabId: TabId }
  | { type: 'OFFSCREEN_READY' }
  | { type: 'CAPTURE_FAILED'; tabId: TabId; reason: CaptureError };

export type MessageResponse =
  | { ok: true; mode: RoutingMode }
  | { ok: false; reason: CaptureError };

export function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const v = value as { type?: unknown };
  return typeof v.type === 'string';
}
