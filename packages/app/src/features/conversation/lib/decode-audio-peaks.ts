export const AUDIO_WAVEFORM_BAR_COUNT = 48;

const peakCache = new Map<string, Promise<number[]>>();

export function samplePeaksFromChannelData(
  channelData: Float32Array,
  barCount: number,
): number[] {
  if (channelData.length === 0 || barCount <= 0) {
    return Array.from({ length: barCount }, () => 0.2);
  }

  const blockSize = Math.max(1, Math.floor(channelData.length / barCount));
  const peaks: number[] = [];

  for (let index = 0; index < barCount; index += 1) {
    const start = index * blockSize;
    let max = 0;
    for (let offset = 0; offset < blockSize; offset += 1) {
      const sample = channelData[start + offset] ?? 0;
      const amplitude = Math.abs(sample);
      if (amplitude > max) max = amplitude;
    }
    peaks.push(max);
  }

  const peakMax = Math.max(...peaks, 0.001);
  return peaks.map((peak) => peak / peakMax);
}

function seededFallbackPeaks(seed: string, barCount: number): number[] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return Array.from({ length: barCount }, (_, index) => {
    const value = Math.sin((hash + index * 17) * 0.37) * 0.5 + 0.5;
    return 0.2 + value * 0.8;
  });
}

async function decodePeaksFromArrayBuffer(
  buffer: ArrayBuffer,
  barCount: number,
): Promise<number[]> {
  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
    const channelData = audioBuffer.getChannelData(0);
    return samplePeaksFromChannelData(channelData, barCount);
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

async function loadPeaksFromUrl(source: string, barCount: number): Promise<number[]> {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to load audio (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return decodePeaksFromArrayBuffer(buffer, barCount);
}

export function decodeAudioPeaks(
  source: string,
  barCount = AUDIO_WAVEFORM_BAR_COUNT,
): Promise<number[]> {
  const cached = peakCache.get(source);
  if (cached) return cached;

  const pending = loadPeaksFromUrl(source, barCount).catch(() =>
    seededFallbackPeaks(source, barCount),
  );
  peakCache.set(source, pending);
  return pending;
}

export function clearAudioPeakCache() {
  peakCache.clear();
}
