type ТипЗвука = "нажатие" | "действие" | "успех" | "эволюция" | "покупка";

let ctx: AudioContext | null = null;
let mute = false;

function получитьКонтекст(): AudioContext | null {
  if (mute) return null;
  const AudioCtor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) {
    ctx = new AudioCtor();
  }
  return ctx;
}

function проигратьТон(
  context: AudioContext,
  fromHz: number,
  toHz: number,
  durationSec: number,
  gainPeak: number,
  type: OscillatorType = "triangle"
): void {
  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(10, toHz), now + durationSec);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + durationSec * 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function установитьЗвукВключен(enabled: boolean): void {
  mute = !enabled;
}

export function проигратьЗвук(type: ТипЗвука): void {
  const context = получитьКонтекст();
  if (!context) return;
  try {
    if (type === "нажатие") {
      проигратьТон(context, 760, 900, 0.09, 0.025);
      return;
    }
    if (type === "действие") {
      проигратьТон(context, 520, 720, 0.14, 0.04);
      return;
    }
    if (type === "успех") {
      проигратьТон(context, 620, 980, 0.2, 0.05);
      window.setTimeout(() => проигратьТон(context, 780, 1180, 0.18, 0.04), 70);
      return;
    }
    if (type === "эволюция") {
      проигратьТон(context, 320, 980, 0.42, 0.06, "sine");
      window.setTimeout(() => проигратьТон(context, 820, 1320, 0.28, 0.05, "triangle"), 120);
      return;
    }
    проигратьТон(context, 460, 760, 0.16, 0.04);
  } catch {
    // Безопасный fallback: ошибки аудио не ломают игру.
  }
}

