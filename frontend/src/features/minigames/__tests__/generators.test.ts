import { describe, expect, it } from "vitest";

import { MINI_GAME_GENERATORS } from "../generators";

const GAME_TYPES = [
  "count_2_4",
  "sum_4_6",
  "compare",
  "fast_count_6_8",
  "sub_1_5",
  "sequence_next",
  "shape_count",
  "word_problem_lite",
  "ru_letter_sound_pick",
  "ru_first_letter_word",
  "ru_vowel_consonant",
  "ru_missing_letter"
] as const;

describe("mini-game generators", () => {
  it("returns a valid question for each game", () => {
    for (const gameType of GAME_TYPES) {
      const question = MINI_GAME_GENERATORS[gameType]();
      expect(question.prompt.length).toBeGreaterThan(0);
      expect(question.visual.length).toBeGreaterThan(0);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(question.options).toContain(question.answer);
    }
  });

  it("letter sound game includes speech metadata", () => {
    const question = MINI_GAME_GENERATORS.ru_letter_sound_pick();
    expect(question.speechText).toBeTruthy();
    expect(question.speechFallbackText).toMatch(/^Слушай:/);
  });

  it("vowel/consonant generator uses only two answer options", () => {
    const question = MINI_GAME_GENERATORS.ru_vowel_consonant();
    expect(question.options).toEqual(["Гласная", "Согласная"]);
  });
});
