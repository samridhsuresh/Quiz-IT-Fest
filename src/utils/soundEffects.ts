export type CategorySoundType =
  | 'computers'
  | 'cars'
  | 'motorcycles'
  | 'traveling'
  | 'programming';

class ArenaSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private activeNodes: Array<{ stop: () => void }> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('ka_sound_muted') === 'true';
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopActiveSounds();
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ka_sound_muted', String(this.muted));
    }
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public stopActiveSounds(): void {
    while (this.activeNodes.length > 0) {
      const item = this.activeNodes.pop();
      try {
        item?.stop();
      } catch {
        // Ignore already stopped nodes
      }
    }
  }

  private trackNode(node: AudioScheduledSourceNode, gain?: GainNode): void {
    const handle = {
      stop: () => {
        try {
          if (gain && this.ctx) {
            gain.gain.cancelScheduledValues(this.ctx.currentTime);
            gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
          }
          node.stop();
        } catch {
          // Ignore
        }
      },
    };
    this.activeNodes.push(handle);
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playCategorySound(category: CategorySoundType): void {
    this.stopActiveSounds();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (category === 'computers') {
        // Electronic boot-up: BIOS POST beep + warm digital power-up harmonic sweep
        const postOsc = ctx.createOscillator();
        const postGain = ctx.createGain();
        postOsc.type = 'square';
        postOsc.frequency.setValueAtTime(987.77, now); // B5 POST beep
        postGain.gain.setValueAtTime(0.045, now);
        postGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        postOsc.connect(postGain);
        postGain.connect(ctx.destination);
        postOsc.start(now);
        postOsc.stop(now + 0.15);
        this.trackNode(postOsc, postGain);

        // Harmonic boot chord sweep
        [220, 330, 440, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 0.85, now + 0.12 + idx * 0.04);
          osc.frequency.exponentialRampToValueAtTime(freq, now + 0.38 + idx * 0.04);
          gain.gain.setValueAtTime(0.001, now + 0.12 + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0.04, now + 0.22 + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.65);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.12 + idx * 0.04);
          osc.stop(now + 0.68);
          this.trackNode(osc, gain);
        });
      } else if (category === 'cars') {
        // Car engine starting: 2 starter crank pulses + deep V8 ignition roar & idle rumble
        [0, 0.11].forEach((offset) => {
          const crank = ctx.createOscillator();
          const crankGain = ctx.createGain();
          crank.type = 'sawtooth';
          crank.frequency.setValueAtTime(65, now + offset);
          crank.frequency.linearRampToValueAtTime(95, now + offset + 0.08);
          crankGain.gain.setValueAtTime(0.055, now + offset);
          crankGain.gain.exponentialRampToValueAtTime(0.005, now + offset + 0.09);
          crank.connect(crankGain);
          crankGain.connect(ctx.destination);
          crank.start(now + offset);
          crank.stop(now + offset + 0.095);
          this.trackNode(crank, crankGain);
        });

        // V8 Ignition roar + warm low-pass filtered rumble
        const engineOsc1 = ctx.createOscillator();
        const engineOsc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const engineGain = ctx.createGain();

        engineOsc1.type = 'sawtooth';
        engineOsc2.type = 'triangle';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(340, now + 0.22);
        filter.frequency.exponentialRampToValueAtTime(160, now + 0.82);

        engineOsc1.frequency.setValueAtTime(72, now + 0.22);
        engineOsc1.frequency.exponentialRampToValueAtTime(155, now + 0.38);
        engineOsc1.frequency.exponentialRampToValueAtTime(84, now + 0.82);

        engineOsc2.frequency.setValueAtTime(108, now + 0.22);
        engineOsc2.frequency.exponentialRampToValueAtTime(232, now + 0.38);
        engineOsc2.frequency.exponentialRampToValueAtTime(126, now + 0.82);

        engineGain.gain.setValueAtTime(0.001, now + 0.22);
        engineGain.gain.linearRampToValueAtTime(0.09, now + 0.34);
        engineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        engineOsc1.connect(filter);
        engineOsc2.connect(filter);
        filter.connect(engineGain);
        engineGain.connect(ctx.destination);

        engineOsc1.start(now + 0.22);
        engineOsc2.start(now + 0.22);
        engineOsc1.stop(now + 0.86);
        engineOsc2.stop(now + 0.86);
        this.trackNode(engineOsc1, engineGain);
        this.trackNode(engineOsc2, engineGain);
      } else if (category === 'motorcycles') {
        // Sports motorcycle revving: aggressive high-RPM throttle blip + exhaust overtone
        const revOsc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const revGain = ctx.createGain();

        revOsc.type = 'sawtooth';
        subOsc.type = 'square';
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(420, now);
        filter.Q.setValueAtTime(1.4, now);

        revOsc.frequency.setValueAtTime(115, now);
        revOsc.frequency.exponentialRampToValueAtTime(480, now + 0.24);
        revOsc.frequency.exponentialRampToValueAtTime(290, now + 0.36);
        revOsc.frequency.exponentialRampToValueAtTime(540, now + 0.50);
        revOsc.frequency.exponentialRampToValueAtTime(140, now + 0.78);

        subOsc.frequency.setValueAtTime(57.5, now);
        subOsc.frequency.exponentialRampToValueAtTime(240, now + 0.24);
        subOsc.frequency.exponentialRampToValueAtTime(270, now + 0.50);
        subOsc.frequency.exponentialRampToValueAtTime(70, now + 0.78);

        revGain.gain.setValueAtTime(0.01, now);
        revGain.gain.linearRampToValueAtTime(0.085, now + 0.22);
        revGain.gain.linearRampToValueAtTime(0.09, now + 0.48);
        revGain.gain.exponentialRampToValueAtTime(0.001, now + 0.80);

        revOsc.connect(filter);
        subOsc.connect(filter);
        filter.connect(revGain);
        revGain.connect(ctx.destination);

        revOsc.start(now);
        subOsc.start(now);
        revOsc.stop(now + 0.82);
        subOsc.stop(now + 0.82);
        this.trackNode(revOsc, revGain);
        this.trackNode(subOsc, revGain);
      } else if (category === 'traveling') {
        // Short airplane flyby whoosh + gentle cabin chime
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 0.75);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(2.8, now);
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.exponentialRampToValueAtTime(980, now + 0.32);
        filter.frequency.exponentialRampToValueAtTime(220, now + 0.72);

        const whooshGain = ctx.createGain();
        whooshGain.gain.setValueAtTime(0.002, now);
        whooshGain.gain.linearRampToValueAtTime(0.08, now + 0.30);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.74);

        noise.connect(filter);
        filter.connect(whooshGain);
        whooshGain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.75);
        this.trackNode(noise, whooshGain);

        // Subtle high-altitude ding-dong chime
        [659.25, 523.25].forEach((freq, idx) => {
          const chime = ctx.createOscillator();
          const chimeGain = ctx.createGain();
          chime.type = 'sine';
          const startAt = now + 0.12 + idx * 0.16;
          chime.frequency.setValueAtTime(freq, startAt);
          chimeGain.gain.setValueAtTime(0.04, startAt);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.28);
          chime.connect(chimeGain);
          chimeGain.connect(ctx.destination);
          chime.start(startAt);
          chime.stop(startAt + 0.30);
          this.trackNode(chime, chimeGain);
        });
      } else if (category === 'programming') {
        // Mechanical keyboard typing clicks + short digital confirmation tone
        const keystrokeOffsets = [0, 0.055, 0.105, 0.165, 0.215, 0.275];
        keystrokeOffsets.forEach((offset, idx) => {
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          clickOsc.type = 'triangle';
          clickOsc.frequency.setValueAtTime(1450 + (idx % 3) * 180, now + offset);
          clickOsc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.025);
          clickGain.gain.setValueAtTime(0.06, now + offset);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.028);
          clickOsc.connect(clickGain);
          clickGain.connect(ctx.destination);
          clickOsc.start(now + offset);
          clickOsc.stop(now + offset + 0.03);
          this.trackNode(clickOsc, clickGain);
        });

        // Short digital confirmation tone
        const confirmOsc = ctx.createOscillator();
        const confirmGain = ctx.createGain();
        confirmOsc.type = 'sine';
        confirmOsc.frequency.setValueAtTime(587.33, now + 0.34);
        confirmOsc.frequency.setValueAtTime(880, now + 0.42);
        confirmGain.gain.setValueAtTime(0.055, now + 0.34);
        confirmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
        confirmOsc.connect(confirmGain);
        confirmGain.connect(ctx.destination);
        confirmOsc.start(now + 0.34);
        confirmOsc.stop(now + 0.60);
        this.trackNode(confirmOsc, confirmGain);
      }
    } catch {
      // Ignore audio errors on restricted autoplay
    }
  }

  public playStartChallenge(): void {
    this.stopActiveSounds();
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.075, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.25);
        this.trackNode(osc, gain);
      });
    } catch {
      // Ignore
    }
  }

  public playSelect(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Ignore audio errors on restricted autoplay
    }
  }

  public playCorrect(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([35]);
      } catch {}
    }
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.09, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.19);
      });
    } catch {}
  }

  public playIncorrect(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([95, 45, 130]);
      } catch {}
    }
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(155, now + 0.22);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {}
  }
}

export const soundFX = new ArenaSoundEngine();
