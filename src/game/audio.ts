export class GameAudio {
  private context?: AudioContext;
  private muted = false;
  private musicTimer?: number;

  setMuted(value: boolean): void {
    this.muted = value;
    if (value) this.stopMusic();
  }

  get isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | undefined {
    if (this.muted) return undefined;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  private tone(frequency: number, duration: number, gain = 0.05, type: OscillatorType = 'sine', delay = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    volume.gain.setValueAtTime(0.001, ctx.currentTime + delay);
    volume.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    oscillator.connect(volume).connect(ctx.destination);
    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration + 0.02);
  }

  swallow(tier: number): void {
    const frequencies = [820, 620, 430, 260, 170, 115, 80, 52];
    const base = frequencies[Math.min(7, Math.max(0, tier - 1))];
    this.tone(base * (0.94 + Math.random() * 0.12), 0.07 + tier * 0.025, 0.035 + tier * 0.005, tier > 4 ? 'sawtooth' : 'sine');
    if (tier >= 4) this.tone(base / 2, 0.2 + tier * 0.035, 0.025, 'triangle', 0.025);
  }

  tierUp(): void {
    [523, 659, 784, 1047].forEach((note, index) => this.tone(note, 0.18, 0.045, 'sine', index * 0.07));
  }

  countdown(value: number): void {
    this.tone(value === 0 ? 880 : 440 + value * 35, value === 0 ? 0.35 : 0.09, 0.055, 'square');
  }

  defeated(): void {
    [220, 174, 130, 82].forEach((note, index) => this.tone(note, 0.35, 0.05, 'sawtooth', index * 0.11));
  }

  victory(): void {
    [392, 523, 659, 784].forEach((note, index) => this.tone(note, 0.35, 0.055, 'triangle', index * 0.11));
  }

  startMusic(): void {
    if (this.musicTimer || this.muted) return;
    let beat = 0;
    const notes = [110, 110, 146.8, 164.8, 110, 196, 164.8, 146.8];
    this.musicTimer = window.setInterval(() => {
      this.tone(notes[beat % notes.length], 0.18, 0.012, 'triangle');
      if (beat % 4 === 0) this.tone(notes[beat % notes.length] / 2, 0.12, 0.015, 'sine');
      beat += 1;
    }, 340);
  }

  stopMusic(): void {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }
}
