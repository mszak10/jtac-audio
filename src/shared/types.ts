export type RoutingMode = 'stereo' | 'left' | 'right';

export type TabId = number;

export interface RoutingState {
  tabId: TabId;
  mode: RoutingMode;
  tabTitle?: string;
  url?: string;
}

export type CaptureError =
  | 'drm-protected'
  | 'no-audio'
  | 'permission-denied'
  | 'unsupported-tab'
  | 'unknown';
