// Web Audio API Synthesized Chime & Text-to-Speech Voice Engine (Zero external dependencies)

class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Explicit user gesture unlock for modern browsers (Chrome/Safari/Edge audio autoplay policy)
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        // Play micro silent tone to unlock audio pipeline
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }

      // Warm up SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        window.speechSynthesis.speak(silentUtterance);
      }

      this.isUnlocked = true;
      return true;
    } catch (err) {
      console.warn('Audio unlock failed or waiting for user gesture:', err);
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    if (typeof window === 'undefined') return false;
    return this.isUnlocked || (this.audioCtx?.state === 'running');
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Text-To-Speech announcement using Web Speech API
  public speak(text: string, lang = 'en-US') {
    if (this.isMuted || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    try {
      // Resume if browser suspended speech
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel(); // Clear queued speech to prioritize latest call

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95; // Crisp, clear announcement pace
      utterance.pitch = 1.05; // Friendly, audible tone
      utterance.volume = 1.0;

      // Pick matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0])) || voices[0];
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
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

  // Authentic service / desk bell chime (metallic dual-harmonic desk ring)
  public playServiceBell() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      this.playTone(ctx, 2093, now, 0.9, 'sine');
      this.playTone(ctx, 3135.96, now, 0.5, 'sine');
      this.playTone(ctx, 4186, now, 0.25, 'triangle');
    } catch (e) {
      console.warn('Bell tone error:', e);
    }
  }

  private lastRingTimestamp: number = 0;
  private speechQueue: Array<{ text: string; lang: string }> = [];
  private isProcessingQueue: boolean = false;

  // Play desk bell chime followed by queued, non-overlapping voice announcement
  public ringAndAnnounce(announcement: string, lang = 'en-US') {
    if (this.isMuted) return;

    // Debounce desk bell chime (max 1 chime per 1.8s) to prevent audio flooding
    const now = Date.now();
    if (now - this.lastRingTimestamp > 1800) {
      this.playServiceBell();
      this.lastRingTimestamp = now;
    }

    // Push into sequential announcement queue
    this.speechQueue.push({ text: announcement, lang });
    this.processSpeechQueue();
  }

  private processSpeechQueue() {
    if (this.isProcessingQueue || this.speechQueue.length === 0) return;
    this.isProcessingQueue = true;

    const next = this.speechQueue.shift();
    if (!next) {
      this.isProcessingQueue = false;
      return;
    }

    // Delay slightly so chime rings cleanly first
    setTimeout(() => {
      this.speak(next.text, next.lang);

      // 3.5 seconds pacing between announcements so kitchen staff hears each alert clearly
      setTimeout(() => {
        this.isProcessingQueue = false;
        this.processSpeechQueue();
      }, 3500);
    }, 650);
  }

  private playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export const audioManager = new AudioManager();
