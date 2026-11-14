// Web Audio API Synthesized Chime (No external audio file dependencies)

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Kitchen chime for new incoming orders (double bell ring)
  public playNewOrderChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1 (High bell)
      this.playTone(ctx, 880, now, 0.4, 'sine');
      // Note 2 (Harmonic)
      this.playTone(ctx, 1174.66, now + 0.15, 0.5, 'sine');
      // Note 3 (Resonance)
      this.playTone(ctx, 1318.51, now + 0.35, 0.7, 'triangle');
    } catch (e) {
      console.warn('Audio playback prevented or unsupported:', e);
    }
  }

  // Success / Confirmed tone
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      this.playTone(ctx, 523.25, now, 0.2, 'sine'); // C5
      this.playTone(ctx, 659.25, now + 0.1, 0.25, 'sine'); // E5
      this.playTone(ctx, 783.99, now + 0.2, 0.4, 'sine'); // G5
    } catch (e) {
      console.warn(e);
    }
  }

  // Cancelled alert tone
  public playCancelTone() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      this.playTone(ctx, 440, now, 0.2, 'sawtooth');
      this.playTone(ctx, 349.23, now + 0.2, 0.4, 'sawtooth');
    } catch (e) {
      console.warn(e);
    }
  }

  private playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const audioManager = new AudioManager();
