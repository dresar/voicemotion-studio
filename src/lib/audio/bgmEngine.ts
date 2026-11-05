class BgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isRunning = false;
  private timer: number | null = null;
  private currentPreset = "lofi";
  private baseVolume = 0.2;
  private duckRatio = 0.3;
  private ducked = false;

  private chordIndex = 0;

  private readonly CHORD_PRESETS: Record<string, number[][]> = {
    lofi: [
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [246.94, 293.66, 392.0, 493.88], // G7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 440.0],  // Am7
    ],
    ambient: [
      [220.0, 329.63, 440.0, 554.37], // A
      [196.0, 293.66, 392.0, 493.88], // G
      [174.61, 261.63, 349.23, 440.0],// F
      [164.81, 246.94, 329.63, 392.0] // Em
    ],
    acoustic: [
      [261.63, 329.63, 392.0, 523.25], // C
      [196.0, 246.94, 293.66, 392.0],  // G
      [220.0, 261.63, 329.63, 440.0],  // Am
      [174.61, 220.0, 261.63, 349.23], // F
    ],
    techno: [
      [130.81, 261.63, 392.0],         // C bass/synth
      [116.54, 233.08, 349.23],        // Bb
      [110.0, 220.0, 329.63],          // A
      [98.0, 196.0, 293.66],           // G
    ],
    bounce: [
      [349.23, 440.0, 523.25, 698.46], // F
      [392.0, 493.88, 587.33, 783.99], // G
      [329.63, 392.0, 493.88, 659.25], // Em
      [440.0, 523.25, 659.25, 880.0],  // Am
    ],
    piano: [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ]
  };

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public start(preset: string = "lofi", volume = 0.2, duckRatio = 0.3) {
    if (this.isRunning) {
      this.stop();
    }
    try {
      this.initContext();
      if (!this.ctx) return;

      this.currentPreset = this.CHORD_PRESETS[preset] ? preset : "lofi";
      this.baseVolume = Math.max(0, Math.min(1, volume));
      this.duckRatio = Math.max(0.1, Math.min(0.8, duckRatio));
      this.ducked = false;
      this.chordIndex = 0;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.baseVolume, this.ctx.currentTime);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(this.currentPreset === "lofi" ? 1800 : 3500, this.ctx.currentTime);

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.isRunning = true;
      this.playNextChord();
    } catch {
      this.isRunning = false;
    }
  }

  private playNextChord() {
    if (!this.isRunning || !this.ctx || !this.filterNode) return;

    const chords = this.CHORD_PRESETS[this.currentPreset] || this.CHORD_PRESETS.lofi;
    const freqs = chords[this.chordIndex % chords.length];
    this.chordIndex++;

    const now = this.ctx.currentTime;
    const duration = 2.4;

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.filterNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.currentPreset === "techno" ? "sawtooth" : (this.currentPreset === "ambient" ? "sine" : "triangle");
      osc.frequency.setValueAtTime(freq, now);

      const noteVolume = 0.12 / Math.sqrt(freqs.length);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(noteVolume, now + (idx * 0.04) + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });

    this.timer = window.setTimeout(() => {
      this.playNextChord();
    }, 2200);
  }

  public setVolume(volume: number) {
    this.baseVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      const target = this.ducked ? this.baseVolume * this.duckRatio : this.baseVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    }
  }

  public setDucking(duck: boolean) {
    this.ducked = duck;
    if (this.masterGain && this.ctx) {
      const target = duck ? this.baseVolume * this.duckRatio : this.baseVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      setTimeout(() => {
        try {
          this.masterGain?.disconnect();
        } catch {
          // ignore disconnect error
        }
      }, 100);
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const bgmEngine = new BgmEngine();
