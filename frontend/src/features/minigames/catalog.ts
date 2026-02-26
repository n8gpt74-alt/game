import type { КатегорияМиниИгры, ТипМиниИгры } from "../../types";
import { MINI_GAME_GENERATORS, type MiniGameQuestion } from "./generators";

export type КатегорияКаталогаМиниИгры = Exclude<КатегорияМиниИгры, "3d">;

export type ОписаниеМиниИгры = {
  type: ТипМиниИгры;
  category: КатегорияКаталогаМиниИгры;
  title: string;
  subtitle: string;
  icon: string;
  generateQuestion?: () => MiniGameQuestion;
};

export const КАТЕГОРИИ_МИНИ_ИГР: Array<{
  id: КатегорияКаталогаМиниИгры;
  title: string;
  subtitle: string;
}> = [
  { id: "math", title: "Математика", subtitle: "Счёт, сравнение и задачи" },
  { id: "letters", title: "Буквы", subtitle: "Азбука и произношение" },
  { id: "logic", title: "Логика", subtitle: "Память, узоры и мышление" },
  { id: "reflex", title: "Реакция", subtitle: "Скорость и координация" }
];

export const КАТАЛОГ_МИНИ_ИГР: ОписаниеМиниИгры[] = [
  { type: "count_2_4", category: "math", title: "Счёт 2-4", subtitle: "Посчитай предметы", icon: "🔢", generateQuestion: MINI_GAME_GENERATORS.count_2_4 },
  { type: "sum_4_6", category: "math", title: "Сложение 4-6", subtitle: "Выбери правильную сумму", icon: "➕", generateQuestion: MINI_GAME_GENERATORS.sum_4_6 },
  { type: "compare", category: "math", title: "Сравнение", subtitle: "Что больше?", icon: "⚖️", generateQuestion: MINI_GAME_GENERATORS.compare },
  { type: "fast_count_6_8", category: "math", title: "Быстрый счёт 6-8", subtitle: "Ответь быстро", icon: "⏱️", generateQuestion: MINI_GAME_GENERATORS.fast_count_6_8 },
  { type: "sub_1_5", category: "math", title: "Вычитание", subtitle: "Простые примеры на минус", icon: "➖", generateQuestion: MINI_GAME_GENERATORS.sub_1_5 },
  { type: "sequence_next", category: "math", title: "Продолжи ряд", subtitle: "Найди следующее число", icon: "📈", generateQuestion: MINI_GAME_GENERATORS.sequence_next },
  { type: "shape_count", category: "math", title: "Счёт фигур", subtitle: "Сколько фигур нужного вида?", icon: "🧩", generateQuestion: MINI_GAME_GENERATORS.shape_count },
  { type: "word_problem_lite", category: "math", title: "Задачка", subtitle: "Короткая текстовая задача", icon: "📝", generateQuestion: MINI_GAME_GENERATORS.word_problem_lite },
  { type: "ru_letter_sound_pick", category: "letters", title: "Буква на слух", subtitle: "Выбери букву по озвучке", icon: "🔊", generateQuestion: MINI_GAME_GENERATORS.ru_letter_sound_pick },
  { type: "ru_first_letter_word", category: "letters", title: "Первая буква", subtitle: "Определи первую букву слова", icon: "🔠", generateQuestion: MINI_GAME_GENERATORS.ru_first_letter_word },
  { type: "ru_vowel_consonant", category: "letters", title: "Гласная или согласная", subtitle: "К какому типу относится буква?", icon: "🗣️", generateQuestion: MINI_GAME_GENERATORS.ru_vowel_consonant },
  { type: "ru_missing_letter", category: "letters", title: "Пропущенная буква", subtitle: "Вставь недостающую букву", icon: "✏️", generateQuestion: MINI_GAME_GENERATORS.ru_missing_letter },
  { type: "memory_pairs", category: "logic", title: "Парочки (Мемори)", subtitle: "Найди парные карточки", icon: "🃏" },
  { type: "pixel_pattern", category: "logic", title: "Собери узор", subtitle: "Воспроизведи рисунок по памяти", icon: "🎨" },
  { type: "hangman", category: "logic", title: "Виселица", subtitle: "Угадай слово по буквам", icon: "🪢" },
  { type: "tic_tac_toe", category: "logic", title: "Крестики-нолики", subtitle: "Сыграй против бота", icon: "⭕" },
  { type: "food_catcher", category: "reflex", title: "Ловец еды", subtitle: "Лови еду, избегай бомб", icon: "🍎" }
];

export function игрыПоКатегории(category: КатегорияКаталогаМиниИгры): ОписаниеМиниИгры[] {
  return КАТАЛОГ_МИНИ_ИГР.filter((game) => game.category === category);
}

export function найтиИгру(type: ТипМиниИгры): ОписаниеМиниИгры | null {
  return КАТАЛОГ_МИНИ_ИГР.find((game) => game.type === type) ?? null;
}
