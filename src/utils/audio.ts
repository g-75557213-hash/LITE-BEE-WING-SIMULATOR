// Lightweight Web Audio API synthesizer for laser blaster & target hit sounds

class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Laser blaster sound (high to low frequency pitch dive)
  playLaser() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      
      // Pitch envelope: 920Hz down to 180Hz
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      // Volume envelope
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Target hit sound (crisp metallic/harmonic ping)
  playHit(isBullseye: boolean) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (isBullseye) {
        // Bullseye: double high-tier chord (587Hz & 880Hz -> 1174Hz)
        [587.33, 880, 1174.66].forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.04);

          gain.gain.setValueAtTime(0.2, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.22);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.25);
        });
      } else {
        // Outer ring hit: single ping
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5 note

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const soundFX = new SoundFX();
