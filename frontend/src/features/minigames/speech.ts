export type РезультатОзвучки = {
  spoken: boolean;
  fallbackText: string | null;
};

function hasSpeechApi(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export function остановитьОзвучку(): void {
  if (!hasSpeechApi()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Игнорируем ошибки браузерного API.
  }
}

export function озвучитьТекст(text: string, lang = "ru-RU", timeoutMs = 1200): Promise<РезультатОзвучки> {
  const normalized = text.trim();
  if (!normalized) return Promise.resolve({ spoken: false, fallbackText: null });

  const fallbackText = `Слушай: ${normalized}`;
  if (!hasSpeechApi()) {
    return Promise.resolve({ spoken: false, fallbackText });
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (spoken: boolean): void => {
      if (settled) return;
      settled = true;
      resolve({ spoken, fallbackText: spoken ? null : fallbackText });
    };

    try {
      const utterance = new window.SpeechSynthesisUtterance(normalized);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const ruVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("ru"));
      if (ruVoice) {
        utterance.voice = ruVoice;
      }

      utterance.onstart = () => finish(true);
      utterance.onerror = () => finish(false);
      utterance.onend = () => finish(true);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      window.setTimeout(() => finish(false), Math.max(300, timeoutMs));
    } catch {
      finish(false);
    }
  });
}
