// ─── Web Audio API Sound Synthesizer for Minigame ───
// Không cần file mp3 ngoài, tải tức thì, không lỗi mạng

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser autoplay policies
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Tiếng chạm/chọn thẻ nhẹ nhàng
  public playSelect() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // ignore
    }
  }

  // Tiếng nối đúng kèm thăng hoa nốt nhạc theo Combo
  public playMatchSuccess(combo: number = 1) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const baseFreq = 440; // A4
      // Tăng cao độ theo số combo (pentatonic scale feel)
      const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const noteIdx = Math.min(combo - 1, scale.length - 1);
      const semitone = scale[Math.max(0, noteIdx)];
      const freq = baseFreq * Math.pow(2, semitone / 12);

      // Chùm 2 nốt hòa âm
      const t = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, t);
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.15);
      gain1.gain.setValueAtTime(0.18, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.25);

      // Note 2 (lấp lánh bell chime)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, t + 0.05);
      gain2.gain.setValueAtTime(0.15, t + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.05);
      osc2.stop(t + 0.35);
    } catch (e) {
      // ignore
    }
  }

  // Tiếng nối sai (soft buzz)
  public playError() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.2);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {
      // ignore
    }
  }

  // Tiếng Combo nổ lửa (x5, x10)
  public playComboFire() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);

        gain.gain.setValueAtTime(0.16, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.25);
      });
    } catch (e) {
      // ignore
    }
  }

  // Tiếng Fanfare kết thúc / Chiến thắng
  public playVictory() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Arpeggio C Major + fanfare chord
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.2, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.5);
      });
    } catch (e) {
      // ignore
    }
  }

  // Tiếng nhịp tim đếm ngược dưới 10 giây
  public playTick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
