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

export function озвучитьТекст(text: string, lang = "ru-RU"): РезультатОзвучки {
  const normalized = text.trim();
  if (!normalized) return { spoken: false, fallbackText: null };

  const fallbackText = `Слушай: ${normalized}`;
  if (!hasSpeechApi()) {
    return { spoken: false, fallbackText };
  }

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

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return { spoken: true, fallbackText: null };
  } catch {
    return { spoken: false, fallbackText };
  }
}
