import type { SfxEvent } from "@/lib/engine/types";

function playTone(
  context: AudioContext,
  destination: AudioNode,
  waveform: OscillatorType,
  startFrequency: number,
  endFrequency: number,
  startTime: number,
  duration: number,
  gain: number,
  pitch: number
): void {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const start = Math.max(context.currentTime + 0.005, startTime);
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(Math.max(20, startFrequency * pitch), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency * pitch), start + duration);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + Math.min(0.025, duration * 0.25));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gainNode);
  gainNode.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playNoise(
  context: AudioContext,
  destination: AudioNode,
  startTime: number,
  duration: number,
  gain: number,
  frequency: number,
  pitch: number
): void {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = Math.max(80, frequency * pitch);
  filter.Q.value = 0.9;
  const gainNode = context.createGain();
  const start = Math.max(context.currentTime + 0.005, startTime);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + Math.min(0.02, duration * 0.3));
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export function playSfxEvent(context: AudioContext, destination: AudioNode, event: SfxEvent, startTime: number): void {
  const start = startTime + event.time;
  const gain = Math.max(0.02, Math.min(1, event.gain));
  const pitch = Math.max(0.5, Math.min(2, event.pitch));
  switch (event.name) {
    case "tick":
      playNoise(context, destination, start, 0.035, gain * 0.5, 3200, pitch);
      break;
    case "click":
      playNoise(context, destination, start, 0.025, gain * 0.45, 1800, pitch);
      break;
    case "tap":
      playNoise(context, destination, start, 0.05, gain * 0.5, 900, pitch);
      break;
    case "type":
      playNoise(context, destination, start, 0.02, gain * 0.35, 2600, pitch);
      break;
    case "snap":
      playNoise(context, destination, start, 0.035, gain * 0.55, 2200, pitch);
      break;
    case "swish":
      playNoise(context, destination, start, 0.25, gain * 0.5, 1400, pitch);
      break;
    case "whoosh":
      playNoise(context, destination, start, 0.35, gain * 0.55, 900, pitch);
      break;
    case "swipe":
      playNoise(context, destination, start, 0.18, gain * 0.45, 1800, pitch);
      break;
    case "whip":
      playNoise(context, destination, start, 0.15, gain * 0.5, 1200, pitch);
      break;
    case "thud":
      playTone(context, destination, "sine", 120, 55, start, 0.18, gain, pitch);
      break;
    case "boom":
      playTone(context, destination, "sine", 85, 38, start, 0.45, gain, pitch);
      break;
    case "impact":
      playTone(context, destination, "sine", 90, 40, start, 0.22, gain, pitch);
      playNoise(context, destination, start, 0.12, gain * 0.55, 500, pitch);
      break;
    case "boing":
      playTone(context, destination, "triangle", 180, 520, start, 0.28, gain * 0.8, pitch);
      break;
    case "rise":
      playTone(context, destination, "sawtooth", 220, 880, start, 0.5, gain * 0.5, pitch);
      break;
    case "riser":
      playTone(context, destination, "sawtooth", 160, 1400, start, 0.9, gain * 0.45, pitch);
      break;
    case "ding":
      playTone(context, destination, "sine", 880, 880, start, 0.45, gain * 0.6, pitch);
      break;
    case "coin":
      playTone(context, destination, "sine", 1046, 1046, start, 0.16, gain * 0.55, pitch);
      playTone(context, destination, "sine", 1568, 1568, start + 0.08, 0.28, gain * 0.5, pitch);
      break;
    case "correct":
      playTone(context, destination, "sine", 660, 660, start, 0.16, gain * 0.5, pitch);
      playTone(context, destination, "sine", 990, 990, start + 0.1, 0.3, gain * 0.5, pitch);
      break;
    case "heart":
      playTone(context, destination, "sine", 70, 48, start, 0.16, gain * 0.8, pitch);
      playTone(context, destination, "sine", 70, 48, start + 0.2, 0.18, gain * 0.7, pitch);
      break;
    case "stamp":
      playTone(context, destination, "sine", 110, 60, start, 0.14, gain * 0.85, pitch);
      playNoise(context, destination, start, 0.08, gain * 0.35, 400, pitch);
      break;
    case "buzzer":
      playTone(context, destination, "square", 180, 150, start, 0.35, gain * 0.45, pitch);
      break;
    case "tada":
      playTone(context, destination, "triangle", 523, 523, start, 0.5, gain * 0.45, pitch);
      playTone(context, destination, "triangle", 659, 659, start, 0.5, gain * 0.4, pitch);
      playTone(context, destination, "triangle", 784, 784, start, 0.55, gain * 0.4, pitch);
      break;
    case "magic":
      playTone(context, destination, "sine", 880, 1760, start, 0.45, gain * 0.45, pitch);
      playNoise(context, destination, start + 0.1, 0.35, gain * 0.3, 4200, pitch);
      break;
    default:
      playTone(context, destination, "sine", 420, 180, start, 0.1, gain * 0.65, pitch);
      break;
  }
}

export interface SfxPlayer {
  playScene: (events: SfxEvent[], baseTime?: number) => void;
  resume: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
}

export function createSfxPlayer(): SfxPlayer {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;

  function ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!context) {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return null;
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(context.destination);
    }
    if (context.state === "suspended") {
      void context.resume();
    }
    return context;
  }

  return {
    playScene: (events, baseTime = 0) => {
      const audioContext = ensure();
      if (!audioContext || !master) return;
      const start = audioContext.currentTime + 0.04 + baseTime;
      events.forEach((event) => playSfxEvent(audioContext, master as AudioNode, event, start));
    },
    resume: async () => {
      const audioContext = ensure();
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }
    },
    setMuted: (value) => {
      muted = value;
      if (master) {
        master.gain.value = value ? 0 : 1;
      }
    },
    dispose: () => {
      if (context) {
        void context.close();
        context = null;
        master = null;
      }
    }
  };
}
