import type { ТипМиниИгры } from "../../types";

export type MiniGameQuestion = {
  prompt: string;
  visual: string;
  options: string[];
  answer: string;
  speechText?: string;
  speechFallbackText?: string;
};

const RU_LETTERS = [
  "А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И", "Й", "К", "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф", "Х", "Ц", "Ч", "Ш", "Щ", "Ъ", "Ы", "Ь", "Э", "Ю", "Я"
] as const;

const RU_VOWELS = new Set(["А", "Е", "Ё", "И", "О", "У", "Ы", "Э", "Ю", "Я"]);

const FIRST_LETTER_WORDS = [
  { emoji: "🍎", word: "ЯБЛОКО" },
  { emoji: "🐟", word: "РЫБА" },
  { emoji: "☀️", word: "СОЛНЦЕ" },
  { emoji: "🐱", word: "КОТ" },
  { emoji: "🦊", word: "ЛИСА" },
  { emoji: "🐘", word: "СЛОН" },
  { emoji: "🥕", word: "МОРКОВЬ" },
  { emoji: "🚗", word: "МАШИНА" }
] as const;

const MISSING_LETTER_WORDS = [
  { word: "КОТ", missingIndex: 1 },
  { word: "ДОМ", missingIndex: 1 },
  { word: "ЛУНА", missingIndex: 1 },
  { word: "СОК", missingIndex: 1 },
  { word: "РЫБА", missingIndex: 1 },
  { word: "ЛИСА", missingIndex: 1 },
  { word: "КАША", missingIndex: 1 },
  { word: "НОС", missingIndex: 1 }
] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)] as T;
}

function numericOptions(correct: number): string[] {
  const variants = new Set<number>([correct]);
  while (variants.size < 3) {
    const delta = randomInt(-3, 3);
    const next = Math.max(0, correct + delta);
    variants.add(next);
  }
  return shuffle(Array.from(variants).map((value) => String(value)));
}

function letterOptions(correct: string, total = 4): string[] {
  const variants = new Set<string>([correct]);
  while (variants.size < total) {
    variants.add(pickOne(RU_LETTERS));
  }
  return shuffle(Array.from(variants));
}

function makeCountQuestion(minCount: number, maxCount: number): MiniGameQuestion {
  const count = randomInt(minCount, maxCount);
  return {
    prompt: "Сколько предметов на экране?",
    visual: "⭐".repeat(count),
    options: numericOptions(count),
    answer: String(count)
  };
}

function makeSumQuestion(): MiniGameQuestion {
  const a = randomInt(1, 3);
  const b = randomInt(3, 5);
  const correct = a + b;
  return {
    prompt: `${a} + ${b} = ?`,
    visual: "🧁".repeat(a) + " + " + "🍓".repeat(b),
    options: numericOptions(correct),
    answer: String(correct)
  };
}

function makeCompareQuestion(): MiniGameQuestion {
  const left = randomInt(2, 9);
  const right = randomInt(2, 9);
  let answer = "=";
  if (left > right) answer = ">";
  if (left < right) answer = "<";
  return {
    prompt: "Выбери верный знак",
    visual: `${left} ? ${right}`,
    options: [">", "<", "="],
    answer
  };
}

function makeSubQuestion(): MiniGameQuestion {
  const a = randomInt(2, 9);
  const b = randomInt(1, Math.min(5, a - 1));
  const correct = a - b;
  return {
    prompt: `${a} − ${b} = ?`,
    visual: "🍏".repeat(a) + " ➖ " + "🍏".repeat(b),
    options: numericOptions(correct),
    answer: String(correct)
  };
}

function makeSequenceQuestion(): MiniGameQuestion {
  const step = pickOne([1, 2, 3]);
  const start = randomInt(1, 7);
  const a = start;
  const b = a + step;
  const c = b + step;
  const correct = c + step;
  return {
    prompt: "Какое число следующее?",
    visual: `${a}, ${b}, ${c}, ?`,
    options: numericOptions(correct),
    answer: String(correct)
  };
}

function makeShapeCountQuestion(): MiniGameQuestion {
  const shapes = [
    { icon: "🔺", label: "треугольников" },
    { icon: "🔵", label: "кружков" },
    { icon: "🟩", label: "квадратов" }
  ] as const;
  const target = pickOne(shapes);
  const other = shuffle(shapes.filter((shape) => shape.icon !== target.icon));

  const targetCount = randomInt(2, 6);
  const otherCountA = randomInt(1, 4);
  const otherCountB = randomInt(1, 4);

  const all = shuffle([
    ...Array.from({ length: targetCount }, () => target.icon),
    ...Array.from({ length: otherCountA }, () => other[0].icon),
    ...Array.from({ length: otherCountB }, () => other[1].icon)
  ]);

  return {
    prompt: `Сколько ${target.label}?`,
    visual: all.join(" "),
    options: numericOptions(targetCount),
    answer: String(targetCount)
  };
}

function makeWordProblemQuestion(): MiniGameQuestion {
  const addition = Math.random() > 0.5;
  if (addition) {
    const a = randomInt(1, 5);
    const b = randomInt(1, 4);
    const correct = a + b;
    return {
      prompt: `У Искры было ${a} яблока. Ещё дали ${b}. Сколько стало?`,
      visual: "🍎".repeat(a) + " + " + "🍎".repeat(b),
      options: numericOptions(correct),
      answer: String(correct)
    };
  }

  const a = randomInt(4, 9);
  const b = randomInt(1, Math.min(4, a - 1));
  const correct = a - b;
  return {
    prompt: `У Искры было ${a} шарика. ${b} он подарил. Сколько осталось?`,
    visual: "🎈".repeat(a) + " − " + "🎈".repeat(b),
    options: numericOptions(correct),
    answer: String(correct)
  };
}

function makeRuLetterSoundPickQuestion(): MiniGameQuestion {
  const letter = pickOne(RU_LETTERS);
  return {
    prompt: "Выбери букву, которую слышишь",
    visual: "🔊 Слушай внимательно",
    options: letterOptions(letter, 4),
    answer: letter,
    speechText: letter,
    speechFallbackText: `Слушай: ${letter}`
  };
}

function makeRuFirstLetterWordQuestion(): MiniGameQuestion {
  const sample = pickOne(FIRST_LETTER_WORDS);
  const answer = sample.word[0] ?? "А";
  return {
    prompt: "Какая первая буква в слове?",
    visual: `${sample.emoji} ${sample.word}`,
    options: letterOptions(answer, 4),
    answer,
    speechText: sample.word,
    speechFallbackText: `Слушай слово: ${sample.word}`
  };
}

function makeRuVowelConsonantQuestion(): MiniGameQuestion {
  const letter = pickOne(RU_LETTERS);
  const answer = RU_VOWELS.has(letter) ? "Гласная" : "Согласная";
  return {
    prompt: `Буква «${letter}» — гласная или согласная?`,
    visual: `🔤 ${letter}`,
    options: ["Гласная", "Согласная"],
    answer,
    speechText: letter,
    speechFallbackText: `Слушай: ${letter}`
  };
}

function makeRuMissingLetterQuestion(): MiniGameQuestion {
  const sample = pickOne(MISSING_LETTER_WORDS);
  const letters = sample.word.split("");
  const answer = letters[sample.missingIndex] ?? "А";
  const visual = letters.map((letter, index) => (index === sample.missingIndex ? "_" : letter)).join("");
  return {
    prompt: "Какая буква пропущена?",
    visual: `✏️ ${visual}`,
    options: letterOptions(answer, 4),
    answer,
    speechText: sample.word,
    speechFallbackText: `Слушай слово: ${sample.word}`
  };
}

export const MINI_GAME_GENERATORS: Record<ТипМиниИгры, () => MiniGameQuestion> = {
  count_2_4: () => makeCountQuestion(2, 4),
  sum_4_6: makeSumQuestion,
  compare: makeCompareQuestion,
  fast_count_6_8: () => makeCountQuestion(6, 8),
  sub_1_5: makeSubQuestion,
  sequence_next: makeSequenceQuestion,
  shape_count: makeShapeCountQuestion,
  word_problem_lite: makeWordProblemQuestion,
  ru_letter_sound_pick: makeRuLetterSoundPickQuestion,
  ru_first_letter_word: makeRuFirstLetterWordQuestion,
  ru_vowel_consonant: makeRuVowelConsonantQuestion,
  ru_missing_letter: makeRuMissingLetterQuestion
};
