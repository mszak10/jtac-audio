import { describe, expect, it } from 'vitest';
import {
  clearTab,
  createStateMap,
  gainsForMode,
  getMode,
  isRoutingMode,
  nextMode,
  requiresCapture,
  setMode,
} from './routing';

describe('gainsForMode', () => {
  it('passes both channels through for stereo', () => {
    expect(gainsForMode('stereo')).toEqual({ left: 1, right: 1 });
  });

  it('mutes the right channel for left mode', () => {
    expect(gainsForMode('left')).toEqual({ left: 1, right: 0 });
  });

  it('mutes the left channel for right mode', () => {
    expect(gainsForMode('right')).toEqual({ left: 0, right: 1 });
  });
});

describe('isRoutingMode', () => {
  it.each(['stereo', 'left', 'right'])('accepts %s', (m) => {
    expect(isRoutingMode(m)).toBe(true);
  });

  it.each([null, undefined, '', 'center', 42, {}])('rejects %p', (v) => {
    expect(isRoutingMode(v)).toBe(false);
  });
});

describe('nextMode', () => {
  it('toggles back to stereo when re-selecting the active mode', () => {
    expect(nextMode('left', 'left')).toBe('stereo');
    expect(nextMode('right', 'right')).toBe('stereo');
  });

  it('switches to the requested mode otherwise', () => {
    expect(nextMode('stereo', 'left')).toBe('left');
    expect(nextMode('left', 'right')).toBe('right');
    expect(nextMode('right', 'stereo')).toBe('stereo');
  });
});

describe('state map', () => {
  it('returns stereo for unknown tabs', () => {
    const store = createStateMap();
    expect(getMode(store, 1)).toBe('stereo');
  });

  it('stores left/right modes and reads them back', () => {
    const store = createStateMap();
    setMode(store, 1, 'left', { tabTitle: 'Tab A' });
    setMode(store, 2, 'right');
    expect(getMode(store, 1)).toBe('left');
    expect(getMode(store, 2)).toBe('right');
  });

  it('removes the entry when set to stereo', () => {
    const store = createStateMap();
    setMode(store, 1, 'left');
    setMode(store, 1, 'stereo');
    expect(store.has(1)).toBe(false);
  });

  it('clears a tab', () => {
    const store = createStateMap();
    setMode(store, 1, 'left');
    expect(clearTab(store, 1)).toBe(true);
    expect(store.has(1)).toBe(false);
    expect(clearTab(store, 1)).toBe(false);
  });

  it('requiresCapture is false for stereo target regardless of current state', () => {
    const s = createStateMap();
    expect(requiresCapture(s, 1, 'stereo')).toBe(false);
    setMode(s, 1, 'left');
    expect(requiresCapture(s, 1, 'stereo')).toBe(false);
  });

  it('requiresCapture is true when going from stereo to a channel mode', () => {
    const s = createStateMap();
    expect(requiresCapture(s, 1, 'left')).toBe(true);
    expect(requiresCapture(s, 1, 'right')).toBe(true);
  });

  it('requiresCapture is false when switching between non-stereo modes (the bug)', () => {
    const s = createStateMap();
    setMode(s, 1, 'left');
    expect(requiresCapture(s, 1, 'right')).toBe(false);
    setMode(s, 1, 'right');
    expect(requiresCapture(s, 1, 'left')).toBe(false);
  });

  it('preserves metadata on the returned state', () => {
    const store = createStateMap();
    const result = setMode(store, 1, 'left', {
      tabTitle: 'YouTube',
      url: 'https://youtube.com',
    });
    expect(result.tabTitle).toBe('YouTube');
    expect(result.url).toBe('https://youtube.com');
  });
});
