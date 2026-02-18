import { afterEach, describe, expect, it, vi } from "vitest";

import { озвучитьТекст, остановитьОзвучку } from "../speech";

const originalSpeechDescriptor = Object.getOwnPropertyDescriptor(window, "speechSynthesis");
const originalUtterance = (window as Window & { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;

function restoreSpeechApi(): void {
  if (originalSpeechDescriptor) {
    Object.defineProperty(window, "speechSynthesis", originalSpeechDescriptor);
  } else {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  }
  (window as Window & { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = originalUtterance;
}

afterEach(() => {
  restoreSpeechApi();
});

describe("speech helper", () => {
  it("returns fallback text when Web Speech API is unavailable", async () => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
    (window as Window & { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = undefined;

    const result = await озвучитьТекст("А");

    expect(result.spoken).toBe(false);
    expect(result.fallbackText).toBe("Слушай: А");
  });

  it("uses speechSynthesis when API is available", async () => {
    const speak = vi.fn((utterance: MockUtterance) => {
      utterance.onstart?.(new Event("start"));
    });
    const cancel = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: unknown = null;
      onstart?: (event: Event) => void;
      onerror?: (event: Event) => void;
      onend?: (event: Event) => void;

      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel,
        speak,
        getVoices: () => [{ lang: "ru-RU", name: "Test RU" }]
      },
      configurable: true
    });
    (window as Window & { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = MockUtterance;

    const result = await озвучитьТекст("Б");

    expect(result.spoken).toBe(true);
    expect(result.fallbackText).toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);

    const utterance = speak.mock.calls[0][0] as MockUtterance;
    expect(utterance.text).toBe("Б");
    expect(utterance.lang).toBe("ru-RU");
  });

  it("stop function is safe without API", () => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
    expect(() => остановитьОзвучку()).not.toThrow();
  });
});
