import type { Message } from '../shared/messages';
import { isMessage } from '../shared/messages';
import { gainsForMode } from '../shared/routing';
import type { RoutingMode, TabId } from '../shared/types';

interface ActivePipeline {
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  splitter: ChannelSplitterNode;
  merger: ChannelMergerNode;
  leftGain: GainNode;
  rightGain: GainNode;
}

const pipelines = new Map<TabId, ActivePipeline>();
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

function teardown(tabId: TabId): void {
  const pipeline = pipelines.get(tabId);
  if (!pipeline) return;
  for (const track of pipeline.stream.getTracks()) {
    track.stop();
  }
  pipeline.source.disconnect();
  pipeline.splitter.disconnect();
  pipeline.leftGain.disconnect();
  pipeline.rightGain.disconnect();
  pipeline.merger.disconnect();
  pipelines.delete(tabId);
}

async function buildPipeline(
  tabId: TabId,
  mode: Exclude<RoutingMode, 'stereo'>,
  streamId: string,
): Promise<void> {
  // Capture is acquired via the streamId issued by the background's
  // tabCapture.getMediaStreamId call; getUserMedia binds it to the
  // offscreen document so we can wire it through the Web Audio graph.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  } as MediaStreamConstraints);

  const ctx = getAudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const splitter = ctx.createChannelSplitter(2);
  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  const merger = ctx.createChannelMerger(2);

  const { left, right } = gainsForMode(mode);
  leftGain.gain.value = left;
  rightGain.gain.value = right;

  source.connect(splitter);
  splitter.connect(leftGain, 0);
  splitter.connect(rightGain, 1);
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);
  merger.connect(ctx.destination);

  pipelines.set(tabId, {
    stream,
    source,
    splitter,
    merger,
    leftGain,
    rightGain,
  });
}

async function applyMode(
  tabId: TabId,
  mode: RoutingMode,
  streamId: string | undefined,
): Promise<void> {
  if (mode === 'stereo') {
    teardown(tabId);
    return;
  }

  const existing = pipelines.get(tabId);
  if (existing) {
    const { left, right } = gainsForMode(mode);
    existing.leftGain.gain.value = left;
    existing.rightGain.gain.value = right;
    return;
  }

  if (!streamId) {
    throw new Error('streamId required to start capture');
  }
  await buildPipeline(tabId, mode, streamId);
}

chrome.runtime.onMessage.addListener((raw: unknown) => {
  if (!isMessage(raw)) return false;

  if (raw.type === 'SET_ROUTING') {
    void applyMode(raw.tabId, raw.mode, raw.streamId).catch((err) => {
      console.error('[offscreen] applyMode failed', err);
      teardown(raw.tabId);
    });
  }

  if (raw.type === 'TAB_CLOSED') {
    teardown(raw.tabId);
  }

  return false;
});

chrome.runtime
  .sendMessage({ type: 'OFFSCREEN_READY' } satisfies Message)
  .catch(() => undefined);

export {};
