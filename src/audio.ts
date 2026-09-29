// Web Audio API Synthesizer with Ambient Sound & Drift Screech

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  constructor() {}

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.isAmbientPlaying = false;
    }
  }

  public playBeep(frequency = 440, duration = 0.1, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore
    }
  }

  public playStartBeep(isFinal = false) {
    this.playBeep(isFinal ? 880 : 440, 0.3, 'triangle');
  }

  public playEngine(throttle: number) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (!this.engineOsc || !this.engineGain) {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 62;
        this.engineGain.gain.value = 0;
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      }
      const now = this.ctx.currentTime;
      const amount = Math.max(0, Math.min(1, throttle));
      this.engineOsc.frequency.setTargetAtTime(58 + amount * 132, now, 0.08);
      this.engineGain.gain.setTargetAtTime(amount > 0.08 ? 0.025 + amount * 0.035 : 0, now, 0.09);
    } catch {
      // Audio is an enhancement; keep the race running if a device blocks it.
    }
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playNitro() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch {
      // Ignore
    }
  }

  public playDriftScreech() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  public playCrash() {
    if (!this.enabled) return;
    this.playBeep(100, 0.25, 'sawtooth');
  }

  public playCoin() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  public playVictory() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const now = (this.ctx?.currentTime || 0) + idx * 0.15;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  /** Original synthesized podium sting; no broadcast or trademarked race recording is used. */
  public playPodiumCelebration() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bus = this.ctx.createDynamicsCompressor();
      bus.threshold.value = -16;
      bus.ratio.value = 4;
      bus.connect(this.ctx.destination);

      const rev = this.ctx.createOscillator();
      const revGain = this.ctx.createGain();
      rev.type = 'sawtooth';
      rev.frequency.setValueAtTime(82, now);
      rev.frequency.exponentialRampToValueAtTime(390, now + 0.72);
      rev.frequency.exponentialRampToValueAtTime(250, now + 1.05);
      revGain.gain.setValueAtTime(0.001, now);
      revGain.gain.linearRampToValueAtTime(0.045, now + 0.18);
      revGain.gain.exponentialRampToValueAtTime(0.001, now + 1.08);
      rev.connect(revGain);
      revGain.connect(bus);
      rev.start(now);
      rev.stop(now + 1.1);

      [659.25, 830.61, 1046.5, 1318.51, 1567.98].forEach((frequency, index) => {
        const start = now + 0.72 + index * 0.16;
        const tone = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        tone.type = index < 2 ? 'triangle' : 'sine';
        tone.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(index === 4 ? 0.13 : 0.085, start + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.52);
        tone.connect(gain);
        gain.connect(bus);
        tone.start(start);
        tone.stop(start + 0.54);
      });

      const roarLength = Math.floor(this.ctx.sampleRate * 1.7);
      const roarBuffer = this.ctx.createBuffer(1, roarLength, this.ctx.sampleRate);
      const roarSamples = roarBuffer.getChannelData(0);
      for (let index = 0; index < roarLength; index++) roarSamples[index] = (Math.random() * 2 - 1) * (0.42 + Math.random() * 0.58);
      const roar = this.ctx.createBufferSource();
      roar.buffer = roarBuffer;
      const roarFilter = this.ctx.createBiquadFilter();
      roarFilter.type = 'bandpass';
      roarFilter.frequency.setValueAtTime(950, now);
      roarFilter.Q.value = 0.65;
      const roarGain = this.ctx.createGain();
      roarGain.gain.setValueAtTime(0.001, now + 0.5);
      roarGain.gain.linearRampToValueAtTime(0.075, now + 1.15);
      roarGain.gain.exponentialRampToValueAtTime(0.001, now + 2.15);
      roar.connect(roarFilter);
      roarFilter.connect(roarGain);
      roarGain.connect(bus);
      roar.start(now + 0.5);
      roar.stop(now + 2.2);

      for (let index = 0; index < 7; index++) {
        const start = now + 1.05 + index * 0.14 + Math.random() * 0.05;
        const clap = this.ctx.createBufferSource();
        const clapBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.09), this.ctx.sampleRate);
        const samples = clapBuffer.getChannelData(0);
        for (let sample = 0; sample < samples.length; sample++) samples[sample] = (Math.random() * 2 - 1) * (1 - sample / samples.length);
        clap.buffer = clapBuffer;
        const clapFilter = this.ctx.createBiquadFilter();
        clapFilter.type = 'bandpass';
        clapFilter.frequency.value = 1700 + Math.random() * 900;
        const clapGain = this.ctx.createGain();
        clapGain.gain.value = 0.035;
        clap.connect(clapFilter);
        clapFilter.connect(clapGain);
        clapGain.connect(bus);
        clap.start(start);
        clap.stop(start + 0.09);
      }
    } catch {
      // Optional podium effects must never interrupt the race or its result screen.
    }
  }

  // Ambient sound based on weather (wind/rain hum)
  public startAmbient(weather: 'sunny' | 'rainy' | 'foggy') {
    if (!this.enabled || this.isAmbientPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      this.isAmbientPlaying = true;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = weather === 'rainy' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(weather === 'rainy' ? 400 : 800, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      noise.start();
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();
