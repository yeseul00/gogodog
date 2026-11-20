/**
 * Web Audio API procedural sound effects synthesizer for Pome Walk.
 * Produces warm, lighthearted storybook tones without external audio files.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean;

  constructor(initialMuted = false) {
    this.muted = initialMuted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public unlock(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playJump(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.11);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playDuck(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playTreat(combo: number, isSpecial = false): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Pentatonic major ascending scale for joyful combo progression
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5];
    const baseFreq = scale[Math.min(Math.max(0, combo - 1), scale.length - 1)];
    const now = ctx.currentTime;

    this.playTone(ctx, baseFreq, now, 0.12, 'sine', 0.13);
    if (isSpecial) {
      this.playTone(ctx, baseFreq * 1.25, now + 0.055, 0.16, 'triangle', 0.12);
      this.playTone(ctx, baseFreq * 1.5, now + 0.11, 0.2, 'sine', 0.11);
    } else {
      this.playTone(ctx, baseFreq * 1.5, now + 0.045, 0.11, 'sine', 0.08);
    }
  }

  public playHeartHeal(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(ctx, freq, now + i * 0.06, 0.18, 'sine', 0.12);
    });
  }

  public playMemoryCollect(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Warm sparkling music-box chime for discovering a Memory Fragment
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98];
    notes.forEach((freq, i) => {
      const start = now + i * 0.055;
      this.playTone(ctx, freq, start, 0.24, 'sine', 0.12);
      this.playTone(ctx, freq * 2, start + 0.015, 0.14, 'triangle', 0.045);
    });
  }

  public playFeverStart(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(ctx, freq, now + i * 0.055, 0.22, 'triangle', 0.14);
    });
  }

  public playFeverBounce(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.13);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playHit(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(82, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playGoHome(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Gentle warm descending lullaby cadence for early return home
    const now = ctx.currentTime;
    const notes = [659.25, 587.33, 523.25, 392.0];
    notes.forEach((freq, i) => {
      this.playTone(ctx, freq, now + i * 0.12, 0.28, 'sine', 0.11);
    });
  }

  public playWalkComplete(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Joyful sparkling major fanfare for finishing the full walk happily
    const now = ctx.currentTime;
    const melody = [
      { freq: 523.25, offset: 0, dur: 0.16 },
      { freq: 659.25, offset: 0.09, dur: 0.16 },
      { freq: 783.99, offset: 0.18, dur: 0.18 },
      { freq: 1046.5, offset: 0.28, dur: 0.42 },
    ];
    for (const note of melody) {
      this.playTone(ctx, note.freq, now + note.offset, note.dur, 'triangle', 0.14);
      this.playTone(ctx, note.freq * 1.5, now + note.offset + 0.02, note.dur * 0.75, 'sine', 0.06);
    }
  }

  public playClick(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playTone(ctx, 560, ctx.currentTime, 0.06, 'sine', 0.08);
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}
