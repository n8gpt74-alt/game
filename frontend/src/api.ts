import type {
  КаталогМагазина,
  КатегорияМиниИгры,
  ОтветДействия,
  ОтветМиниИгры,
  ОтветПокупки,
  ЗаписьСобытия,
  ЗапросРезультатаМиниИгры,
  Награда,
  ПредметИнвентаря,
  СостояниеДостижения,
  СостояниеЗаданий,
  СостояниеПитомца,
  СостояниеСерии,
  СостояниеСобытия,
  ТипДействия,
  ТипМиниИгры,
  ТоварМагазина
} from "./types";

const API_BASE = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE ?? "/api").replace(/\/+$/, "");
const LOCAL_TOKEN = "локальный-режим";

function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function nowIso(): string {
  return new Date().toISOString();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function опытДоСледующегоУровня(level: number): number {
  return Math.ceil(50 * level ** 1.4);
}

function стадияПоУровню(level: number): СостояниеПитомца["stage"] {
  if (level <= 5) return "baby";
  if (level <= 10) return "child";
  if (level <= 20) return "teen";
  return "adult";
}

function названиеСтадии(stage: СостояниеПитомца["stage"]): string {
  if (stage === "baby") return "Малыш";
  if (stage === "child") return "Ребёнок";
  if (stage === "teen") return "Подросток";
  return "Взрослый";
}

function определитьСостояниеПитомца(state: СостояниеПитомца): string {
  if (state.hunger < 30) return "Голодный";
  if (state.energy < 20) return "Уставший";
  if (state.hygiene < 30) return "Грязный";
  if (state.health < 40) return "Больной";
  if (state.happiness > 80) return "Радостный";
  if (state.happiness < 35) return "Грустный";
  if (state.happiness > 65 && state.energy > 60) return "Игривый";
  if (state.energy > 55 && state.health > 60) return "Любопытный";
  return "Спокойный";
}

function ценаМагазина(basePrice: number, level: number): number {
  return Math.round(basePrice * 1.8 ** Math.max(1, level));
}

const SHOP_BASE: Array<Omit<ТоварМагазина, "price" | "owned">> = [
  // Еда
  { item_key: "food_apple", title: "🍎 Яблоко", section: "Еда", base_price: 5, level_required: 1 },
  { item_key: "food_carrot", title: "🥕 Морковь", section: "Еда", base_price: 8, level_required: 1 },
  { item_key: "food_candy", title: "🍬 Конфеты", section: "Еда", base_price: 10, level_required: 1 },
  { item_key: "food_icecream", title: "🍦 Мороженое", section: "Еда", base_price: 12, level_required: 2 },
  { item_key: "food_cake", title: "🍰 Торт", section: "Еда", base_price: 15, level_required: 2 },
  { item_key: "food_pizza", title: "🍕 Пицца", section: "Еда", base_price: 20, level_required: 3 },
  { item_key: "food_steak", title: "🥩 Стейк", section: "Еда", base_price: 30, level_required: 5 },
  { item_key: "food_sushi", title: "🍣 Суши", section: "Еда", base_price: 40, level_required: 7 },
  
  // Лекарства
  { item_key: "medicine_bandage", title: "🩹 Бинт", section: "Лекарства", base_price: 10, level_required: 1 },
  { item_key: "medicine_syringe", title: "💉 Укол", section: "Лекарства", base_price: 18, level_required: 2 },
  { item_key: "medicine_potion", title: "🧪 Зелье", section: "Лекарства", base_price: 25, level_required: 2 },
  { item_key: "medicine_elixir", title: "⚗️ Эликсир", section: "Лекарства", base_price: 50, level_required: 5 },
  
  // Средства для мытья
  { item_key: "wash_soap", title: "🧼 Мыло", section: "Гигиена", base_price: 8, level_required: 1 },
  { item_key: "wash_sponge", title: "🧽 Мочалка", section: "Гигиена", base_price: 10, level_required: 1 },
  { item_key: "wash_toothbrush", title: "🪥 Зубная щётка", section: "Гигиена", base_price: 12, level_required: 1 },
  { item_key: "wash_shampoo", title: "🧴 Шампунь", section: "Гигиена", base_price: 15, level_required: 2 },
  { item_key: "wash_spa", title: "🛁 СПА-набор", section: "Гигиена", base_price: 35, level_required: 4 },
  
  // Игрушки
  { item_key: "toy_ball", title: "⚽ Мяч", section: "Игрушки", base_price: 12, level_required: 1 },
  { item_key: "toy_frisbee", title: "🥏 Фрисби", section: "Игрушки", base_price: 18, level_required: 2 },
  { item_key: "toy_puzzle", title: "🧩 Головоломка", section: "Игрушки", base_price: 25, level_required: 3 },
  { item_key: "toy_guitar", title: "🎸 Гитара", section: "Игрушки", base_price: 30, level_required: 3 },
  { item_key: "toy_accordion", title: "🪗 Гармонь", section: "Игрушки", base_price: 35, level_required: 4 },
  { item_key: "toy_saxophone", title: "🎷 Саксофон", section: "Игрушки", base_price: 40, level_required: 5 },
  { item_key: "toy_drum", title: "🥁 Барабан", section: "Игрушки", base_price: 28, level_required: 3 },
  { item_key: "toy_bicycle", title: "🚲 Велосипед", section: "Игрушки", base_price: 50, level_required: 6 },
  
  // Украшения
  { item_key: "decor_star_halo", title: "⭐ Звёздный венок", section: "Украшения", base_price: 35, level_required: 1 },
  { item_key: "decor_moon_tiara", title: "🌙 Лунная тиара", section: "Украшения", base_price: 65, level_required: 4 },
  { item_key: "horn_glow_amber", title: "✨ Янтарное сияние", section: "Эффекты рога", base_price: 50, level_required: 3 },
  { item_key: "horn_glow_aurora", title: "🌈 Аврора-свечение", section: "Эффекты рога", base_price: 90, level_required: 7 },
  { item_key: "theme_spring_room", title: "🌸 Весенняя комната", section: "Темы комнаты", base_price: 70, level_required: 5 },
  { item_key: "theme_crystal_room", title: "💎 Кристальная комната", section: "Темы комнаты", base_price: 120, level_required: 10 },
  { item_key: "acc_scarf_sky", title: "🧣 Небесный шарф", section: "Аксессуары", base_price: 45, level_required: 2 },
  { item_key: "acc_boots_cloud", title: "👢 Облачные ботинки", section: "Аксессуары", base_price: 80, level_required: 8 }
];

const DEFAULT_DAILY_TASKS = [
  { task_key: "feed_count", title: "Покормить 2 раза", target: 2, progress: 0, completed: false },
  { task_key: "minigame_count", title: "Пройти 1 мини-игру", target: 1, progress: 0, completed: false },
  { task_key: "math_minigame_count", title: "Математика: 1 мини-игра", target: 1, progress: 0, completed: false },
  { task_key: "letters_game_count", title: "Буквы: 1 игра", target: 1, progress: 0, completed: false },
  { task_key: "play_count", title: "Поиграть 1 раз", target: 1, progress: 0, completed: false }
] as const;

const MINI_GAME_CATEGORY_BY_TYPE: Record<ТипМиниИгры, Exclude<КатегорияМиниИгры, "3d">> = {
  count_2_4: "math",
  sum_4_6: "math",
  compare: "math",
  fast_count_6_8: "math",
  sub_1_5: "math",
  sequence_next: "math",
  shape_count: "math",
  word_problem_lite: "math",
  ru_letter_sound_pick: "letters",
  ru_first_letter_word: "letters",
  ru_vowel_consonant: "letters",
  ru_missing_letter: "letters"
};

type ЛокальноеХранилище = {
  state: СостояниеПитомца;
  history: ЗаписьСобытия[];
  daily: СостояниеЗаданий;
  dailyDateKey: string;
  inventory: ПредметИнвентаря[];
  streak: СостояниеСерии;
  activeEvent: СостояниеСобытия;
  achievementProgress: Record<string, { progress: number; claimed: boolean }>;
  nextEventId: number;
};

function cloneDefaultDailyTasks(): СостояниеЗаданий["tasks"] {
  return DEFAULT_DAILY_TASKS.map((task) => ({ ...task }));
}

function normalizeDailyTasks(tasks: СостояниеЗаданий["tasks"]): СостояниеЗаданий["tasks"] {
  const byKey = new Map<string, СостояниеЗаданий["tasks"][number]>();
  for (const task of tasks) {
    byKey.set(task.task_key, { ...task });
  }

  const normalized = cloneDefaultDailyTasks().map((task) => {
    const existing = byKey.get(task.task_key);
    if (!existing) return task;
    const progress = Math.max(0, Number(existing.progress) || 0);
    const target = Math.max(1, Number(existing.target) || task.target);
    return {
      ...task,
      title: existing.title || task.title,
      target,
      progress,
      completed: progress >= target || Boolean(existing.completed)
    };
  });

  for (const task of tasks) {
    if (normalized.some((row) => row.task_key === task.task_key)) continue;
    normalized.push({ ...task, completed: Number(task.progress) >= Number(task.target) || Boolean(task.completed) });
  }

  return normalized;
}

function категорияМиниИгры(
  gameType: ТипМиниИгры,
  source: ЗапросРезультатаМиниИгры["source"] | undefined
): КатегорияМиниИгры {
  if (source === "3d") return "3d";
  return MINI_GAME_CATEGORY_BY_TYPE[gameType] ?? "math";
}

function ensureDailyTask(taskKey: string): СостояниеЗаданий["tasks"][number] | null {
  const existing = localStore.daily.tasks.find((task) => task.task_key === taskKey);
  if (existing) return existing;

  const template = DEFAULT_DAILY_TASKS.find((task) => task.task_key === taskKey);
  if (!template) return null;

  const created = { ...template };
  localStore.daily.tasks.push(created);
  return created;
}

function incrementDailyTask(taskKey: string, amount = 1): void {
  if (amount <= 0) return;
  const task = ensureDailyTask(taskKey);
  if (!task) return;
  task.progress += amount;
  task.completed = task.progress >= task.target;
  localStore.daily.all_completed = localStore.daily.tasks.every((row) => row.completed);
}


function создатьЛокальныйState(): СостояниеПитомца {
  return {
    user_id: 10001,
    name: "Искра",
    stage: "baby",
    stage_title: "Малыш",
    level: 1,
    xp: 0,
    xp_to_next_level: опытДоСледующегоУровня(1),
    coins: 1000,
    intelligence: 0,
    crystals: 0,
    hunger: 82,
    hygiene: 80,
    happiness: 80,
    health: 84,
    energy: 85,
    behavior_state: "Спокойный",
    is_lonely: false,
    last_tick_at: nowIso()
  };
}

const localStore: ЛокальноеХранилище = {
  state: создатьЛокальныйState(),
  history: [],
  daily: {
    tasks: cloneDefaultDailyTasks(),
    login_bonus_claimed: false,
    chest_claimed: false,
    all_completed: false
  },
  dailyDateKey: dateKeyNow(),
  inventory: [
    { item_key: "food_apple", quantity: 8 },
    { item_key: "food_carrot", quantity: 5 },
    { item_key: "wash_soap", quantity: 5 },
    { item_key: "medicine_bandage", quantity: 3 },
    { item_key: "toy_ball", quantity: 3 }
  ],
  streak: { current: 0, best: 0, last_claim_date: null },
  activeEvent: {
    event_key: "spring_festival_2026",
    title: "Весенний фестиваль",
    description: "Наберите очки активности и получите редкую награду",
    target_points: 40,
    progress_points: 0,
    reward_coins: 300,
    reward_xp: 120,
    started_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    ends_at: new Date("2027-01-01T00:00:00.000Z").toISOString(),
    completed: false,
    claimed: false
  },
  achievementProgress: {},
  nextEventId: 1
};

function resetLocalFallbackStore(): void {
  localStore.state = создатьЛокальныйState();
  localStore.history = [];
  localStore.daily = {
    tasks: cloneDefaultDailyTasks(),
    login_bonus_claimed: false,
    chest_claimed: false,
    all_completed: false
  };
  localStore.dailyDateKey = dateKeyNow();
  localStore.inventory = [
    { item_key: "food_apple", quantity: 8 },
    { item_key: "food_carrot", quantity: 5 },
    { item_key: "wash_soap", quantity: 5 },
    { item_key: "medicine_bandage", quantity: 3 },
    { item_key: "toy_ball", quantity: 3 }
  ];
  localStore.streak = { current: 0, best: 0, last_claim_date: null };
  localStore.activeEvent = {
    event_key: "spring_festival_2026",
    title: "Весенний фестиваль",
    description: "Наберите очки активности и получите редкую награду",
    target_points: 40,
    progress_points: 0,
    reward_coins: 300,
    reward_xp: 120,
    started_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    ends_at: new Date("2027-01-01T00:00:00.000Z").toISOString(),
    completed: false,
    claimed: false
  };
  localStore.achievementProgress = {};
  localStore.nextEventId = 1;
}

export function гидратироватьЛокальныйFallback(
  snapshot: {
    state: СостояниеПитомца | null;
    history: ЗаписьСобытия[];
    daily: СостояниеЗаданий | null;
    daily_date_key?: string | null;
    inventory: ПредметИнвентаря[];
    streak: СостояниеСерии | null;
    activeEvent: СостояниеСобытия | null;
    achievements: СостояниеДостижения[];
  } | null
): void {
  resetLocalFallbackStore();

  if (!snapshot?.state) return;

  localStore.state = { ...snapshot.state };
  localStore.history = Array.isArray(snapshot.history) ? snapshot.history.map((row) => ({ ...row })) : [];
  if (snapshot.daily) {
    const tasks = normalizeDailyTasks(snapshot.daily.tasks.map((task) => ({ ...task })));
    localStore.daily = {
      ...snapshot.daily,
      tasks,
      all_completed: tasks.every((task) => task.completed)
    };
  }
  localStore.inventory = Array.isArray(snapshot.inventory)
    ? snapshot.inventory.map((row) => ({ ...row }))
    : [];
  localStore.dailyDateKey = (snapshot.daily_date_key ?? "").trim() || dateKeyNow();

  if (snapshot.streak) {
    localStore.streak = { ...snapshot.streak };
  }
  if (snapshot.activeEvent) {
    localStore.activeEvent = { ...snapshot.activeEvent };
  }

  localStore.achievementProgress = {};
  for (const row of Array.isArray(snapshot.achievements) ? snapshot.achievements : []) {
    if (!row || typeof row !== "object") continue;
    const key = (row as СостояниеДостижения).achievement_key;
    if (!key || !(key in ACHIEVEMENT_DEFS)) continue;
    localStore.achievementProgress[key] = {
      progress: Math.max(0, (row as СостояниеДостижения).progress ?? 0),
      claimed: Boolean((row as СостояниеДостижения).claimed)
    };
  }

  const maxId = localStore.history.reduce((max, row) => {
    if (typeof row.id !== "number") return max;
    return Math.max(max, row.id);
  }, 0);
  localStore.nextEventId = maxId + 1;
  ensureLocalDailyStateFresh();
}


function dateKeyNow(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureLocalDailyStateFresh(): void {
  const today = dateKeyNow();
  if (localStore.dailyDateKey === today) return;

  localStore.dailyDateKey = today;
  localStore.daily = {
    tasks: cloneDefaultDailyTasks(),
    login_bonus_claimed: false,
    chest_claimed: false,
    all_completed: false
  };
}

function streakBonusFor(streak: number): { coins: number; xp: number; milestone: number | null } {
  if (streak >= 30) return { coins: 80, xp: 30, milestone: 30 };
  if (streak >= 14) return { coins: 45, xp: 18, milestone: 14 };
  if (streak >= 7) return { coins: 25, xp: 10, milestone: 7 };
  if (streak >= 3) return { coins: 10, xp: 4, milestone: 3 };
  return { coins: 0, xp: 0, milestone: null };
}

const EVENT_POINTS_BY_ACTION: Record<ТипДействия, number> = {
  feed: 1,
  wash: 1,
  play: 2,
  heal: 1,
  chat: 1,
  sleep: 3,
  clean: 1
};

type AchievementDef = {
  title: string;
  description: string;
  target: number;
  reward_coins: number;
  reward_xp: number;
};

const ACHIEVEMENT_DEFS: Record<string, AchievementDef> = {
  feed_count_25: { title: "Заботливый кормилец", description: "Покормить питомца 25 раз", target: 25, reward_coins: 120, reward_xp: 50 },
  play_count_25: { title: "Друг по играм", description: "Поиграть с питомцем 25 раз", target: 25, reward_coins: 140, reward_xp: 60 },
  minigame_count_20: { title: "Мини-игроман", description: "Пройти 20 мини-игр", target: 20, reward_coins: 180, reward_xp: 80 },
  math_minigame_count_20: { title: "Математический ум", description: "Пройти 20 математических мини-игр", target: 20, reward_coins: 220, reward_xp: 95 },
  letters_game_count_20: { title: "Азбука в деле", description: "Пройти 20 буквенных игр", target: 20, reward_coins: 220, reward_xp: 95 },
  coins_earned_1000: { title: "Копилка", description: "Заработать 1000 монет", target: 1000, reward_coins: 250, reward_xp: 90 },
  streak_best_7: { title: "Неделя вместе", description: "Поддерживать серию входов 7 дней", target: 7, reward_coins: 220, reward_xp: 100 },
  streak_best_30: { title: "Легенда заботы", description: "Поддерживать серию входов 30 дней", target: 30, reward_coins: 700, reward_xp: 250 }
};

function ensureAchievementRow(achievementKey: string): { progress: number; claimed: boolean } {
  const existing = localStore.achievementProgress[achievementKey];
  if (existing) return existing;
  const row = { progress: 0, claimed: false };
  localStore.achievementProgress[achievementKey] = row;
  return row;
}

function achievementState(achievementKey: string): СостояниеДостижения {
  const def = ACHIEVEMENT_DEFS[achievementKey];
  const row = ensureAchievementRow(achievementKey);
  const completed = row.progress >= def.target;
  return {
    achievement_key: achievementKey,
    title: def.title,
    description: def.description,
    target: def.target,
    progress: row.progress,
    reward_coins: def.reward_coins,
    reward_xp: def.reward_xp,
    completed,
    claimed: row.claimed
  };
}

function listAchievementStates(): СостояниеДостижения[] {
  return Object.keys(ACHIEVEMENT_DEFS).map((key) => achievementState(key));
}

function addAchievementProgressLocal(achievementKey: string, delta: number, notifications: string[]): void {
  if (delta <= 0) return;
  const def = ACHIEVEMENT_DEFS[achievementKey];
  if (!def) return;
  const row = ensureAchievementRow(achievementKey);
  const before = row.progress;
  row.progress += delta;
  if (!row.claimed && before < def.target && row.progress >= def.target) {
    notifications.push(`Достижение выполнено: ${def.title}`);
  }
}

function setAchievementProgressMaxLocal(achievementKey: string, value: number, notifications: string[]): void {
  const def = ACHIEVEMENT_DEFS[achievementKey];
  if (!def) return;
  const row = ensureAchievementRow(achievementKey);
  const before = row.progress;
  row.progress = Math.max(row.progress, value);
  if (!row.claimed && before < def.target && row.progress >= def.target) {
    notifications.push(`Достижение выполнено: ${def.title}`);
  }
}

function addEventPointsLocal(points: number, notifications: string[]): void {
  if (points <= 0) return;
  if (localStore.activeEvent.claimed) return;
  const before = localStore.activeEvent.progress_points;
  localStore.activeEvent.progress_points += points;
  localStore.activeEvent.completed = localStore.activeEvent.progress_points >= localStore.activeEvent.target_points;
  if (!localStore.activeEvent.claimed && before < localStore.activeEvent.target_points && localStore.activeEvent.completed) {
    notifications.push("Событие завершено! Заберите награду в разделе «События»");
  }
}

function isFetchLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    error.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("cors")
  );
}

function addHistory(action: string, payload: Record<string, unknown>): ЗаписьСобытия {
  const row: ЗаписьСобытия = {
    id: localStore.nextEventId++,
    action,
    payload,
    created_at: nowIso()
  };
  localStore.history = [row, ...localStore.history].slice(0, 50);
  return row;
}

function updateDailyFromAction(action: ТипДействия): void {
  const taskKeyByAction: Partial<Record<ТипДействия, string>> = {
    feed: "feed_count",
    play: "play_count"
  };
  const taskKey = taskKeyByAction[action];
  if (!taskKey) return;
  incrementDailyTask(taskKey, 1);
}

function updateDailyFromMiniGame(category: КатегорияМиниИгры): void {
  incrementDailyTask("minigame_count", 1);
  if (category === "math") {
    incrementDailyTask("math_minigame_count", 1);
  }
  if (category === "letters") {
    incrementDailyTask("letters_game_count", 1);
  }
}

function gainProgress(baseXp: number, baseCoins: number, baseIntelligence = 0): Награда {
  const pet = localStore.state;
  const stageBefore = pet.stage;
  const multiplier = 1 + pet.intelligence / 100;
  const gainedXp = Math.round(baseXp * multiplier);
  pet.xp += gainedXp;
  pet.coins = Math.max(0, pet.coins + baseCoins);
  pet.intelligence += Math.max(0, baseIntelligence);

  const levels: number[] = [];
  while (pet.xp >= опытДоСледующегоУровня(pet.level)) {
    pet.xp -= опытДоСледующегоУровня(pet.level);
    pet.level += 1;
    levels.push(pet.level);
    pet.coins += 12 + pet.level * 2;
  }
  pet.stage = стадияПоУровню(pet.level);
  pet.stage_title = названиеСтадии(pet.stage);
  pet.xp_to_next_level = опытДоСледующегоУровня(pet.level);
  pet.behavior_state = определитьСостояниеПитомца(pet);
  pet.last_tick_at = nowIso();

  return {
    xp: gainedXp,
    coins: baseCoins,
    intelligence: baseIntelligence,
    crystals: 0,
    level_up: levels.length > 0,
    levels,
    stage_changed: pet.stage !== stageBefore,
    stage_before: stageBefore,
    stage_after: pet.stage,
    unlocks: levels.map((lvl) => `украшение_уровень_${lvl}`)
  };
}

function applyActionStats(action: ТипДействия): void {
  const pet = localStore.state;
  if (action === "feed") {
    pet.hunger = clamp(pet.hunger + 18);
    pet.happiness = clamp(pet.happiness + 3);
    pet.hygiene = clamp(pet.hygiene - 1);
  } else if (action === "wash") {
    pet.hygiene = clamp(pet.hygiene + 28);
    pet.health = clamp(pet.health + 3);
    pet.happiness = clamp(pet.happiness + 2);
  } else if (action === "play") {
    pet.happiness = clamp(pet.happiness + 20);
    pet.energy = clamp(pet.energy - 10);
    pet.hunger = clamp(pet.hunger - 4);
    pet.hygiene = clamp(pet.hygiene - 2);
  } else if (action === "heal") {
    pet.health = clamp(pet.health + 24);
    pet.happiness = clamp(pet.happiness + 4);
    pet.energy = clamp(pet.energy - 2);
  } else if (action === "clean") {
    pet.hygiene = clamp(pet.hygiene + 15);
    pet.happiness = clamp(pet.happiness + 5);
    pet.hunger = 50;  // Снижаем сытость до 50%
  } else {
    pet.happiness = clamp(pet.happiness + 10);
    pet.health = clamp(pet.health + 2);
    pet.energy = clamp(pet.energy - 1);
  }
  pet.behavior_state = определитьСостояниеПитомца(pet);
}

function localAction(action: ТипДействия): ОтветДействия {
  applyActionStats(action);
  updateDailyFromAction(action);

  const reward = action === "feed"
    ? gainProgress(5, 2)
    : action === "wash"
      ? gainProgress(5, 2)
      : action === "play"
        ? gainProgress(10, 5)
        : action === "heal"
          ? gainProgress(7, 3)
          : action === "clean"
            ? gainProgress(3, 5)
            : gainProgress(4, 1);

  const notifications: string[] = [];
  addEventPointsLocal(EVENT_POINTS_BY_ACTION[action] ?? 0, notifications);
  if (action === "feed") addAchievementProgressLocal("feed_count_25", 1, notifications);
  if (action === "play") addAchievementProgressLocal("play_count_25", 1, notifications);
  addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

  if (localStore.state.hunger < 30) notifications.push("Дракончик Искра проголодался");
  if (reward.level_up) notifications.push("Новый уровень!");

  const event = addHistory(action, {
    reward,
    daily: localStore.daily,
    notifications,
    stats: localStore.state
  });

  return {
    state: { ...localStore.state },
    event,
    reward,
    daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
    notifications
  };
}

function localMiniGame(payload: ЗапросРезультатаМиниИгры): ОтветМиниИгры {
  const success = payload.score >= 3;
  const source = payload.source ?? "math";
  const category = категорияМиниИгры(payload.game_type, source);
  const isMathMiniGame = source === "math";
  const energyRecovered = isMathMiniGame ? (success ? 12 : 6) : 0;
  const reward = success ? gainProgress(15, 10, 2) : gainProgress(6, 3, 0);
  if (energyRecovered > 0) {
    localStore.state.energy = clamp(localStore.state.energy + energyRecovered);
    localStore.state.happiness = clamp(localStore.state.happiness + (success ? 4 : 2));
    localStore.state.behavior_state = определитьСостояниеПитомца(localStore.state);
  }

  const beforeCompleted = new Map(localStore.daily.tasks.map((task) => [task.task_key, task.completed]));
  updateDailyFromMiniGame(category);

  const notifications: string[] = [];
  addEventPointsLocal(success ? 2 : 1, notifications);
  addAchievementProgressLocal("minigame_count_20", 1, notifications);
  if (category === "math") addAchievementProgressLocal("math_minigame_count_20", 1, notifications);
  if (category === "letters") addAchievementProgressLocal("letters_game_count_20", 1, notifications);
  addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

  if (energyRecovered > 0) notifications.push(`Энергия восстановлена: +${energyRecovered}`);
  if (reward.level_up) notifications.push("Новый уровень!");

  const completedNow = localStore.daily.tasks.some(
    (task) => task.completed && !beforeCompleted.get(task.task_key)
  );
  if (completedNow) {
    notifications.push("Задание выполнено");
  }

  const event = addHistory("мини_игра", {
    game_type: payload.game_type,
    category,
    score: payload.score,
    elapsed_ms: payload.elapsed_ms,
    source,
    energy_recovered: energyRecovered,
    reward,
    daily: localStore.daily,
    notifications,
    stats: localStore.state
  });

  return {
    state: { ...localStore.state },
    event,
    reward,
    daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
    notifications
  };
}

function localCatalog(): КаталогМагазина {
  const items: ТоварМагазина[] = SHOP_BASE.map((row) => ({
    ...row,
    price: ценаМагазина(row.base_price, localStore.state.level),
    owned: (localStore.inventory.find((item) => item.item_key === row.item_key)?.quantity ?? 0) > 0
  }));
  return { items };
}

function localBuy(itemKey: string): ОтветПокупки {
  const item = localCatalog().items.find((row) => row.item_key === itemKey);
  if (!item) throw new Error("Товар не найден");
  if (localStore.state.level < item.level_required) throw new Error("Недостаточный уровень");
  if (localStore.state.coins < item.price) throw new Error("Недостаточно монет");

  localStore.state.coins -= item.price;
  const existing = localStore.inventory.find((row) => row.item_key === item.item_key);
  if (existing) {
    existing.quantity += 1;
  } else {
    localStore.inventory.push({ item_key: item.item_key, quantity: 1 });
  }
  const event = addHistory("покупка", { item_key: item.item_key, title: item.title, price: item.price });
  return { state: { ...localStore.state }, event, item_key: item.item_key, price: item.price };
}

function localUseItem(itemKey: string): ОтветДействия {
  const normalizedItemKey = itemKey.trim();
  if (!normalizedItemKey) {
    throw new Error(JSON.stringify({ detail: "Не указан предмет" }));
  }
  const inventoryItem = localStore.inventory.find((row) => row.item_key === normalizedItemKey);
  if (!inventoryItem || inventoryItem.quantity <= 0) {
    throw new Error(JSON.stringify({ detail: "У вас нет этого предмета" }));
  }
  const action: ТипДействия = normalizedItemKey.startsWith("food_")
    ? "feed"
    : normalizedItemKey.startsWith("wash_")
      ? "wash"
      : normalizedItemKey.startsWith("medicine_")
        ? "heal"
        : normalizedItemKey.startsWith("toy_")
          ? "play"
          : "chat";
  const itemEffects: Record<string, Partial<Record<"hunger" | "hygiene" | "happiness" | "health" | "energy" | "intelligence", number>>> = {
    food_apple: { hunger: 15, happiness: 2 },
    food_carrot: { hunger: 18, happiness: 3 },
    food_candy: { hunger: 12, happiness: 8 },
    food_icecream: { hunger: 20, happiness: 10 },
    food_cake: { hunger: 25, happiness: 8 },
    food_pizza: { hunger: 30, happiness: 10 },
    food_steak: { hunger: 35, happiness: 12 },
    food_sushi: { hunger: 40, happiness: 15 },
    medicine_bandage: { health: 20, energy: 5 },
    medicine_syringe: { health: 30, energy: 8 },
    medicine_potion: { health: 35, energy: 10 },
    medicine_elixir: { health: 50, energy: 20 },
    wash_soap: { hygiene: 25, happiness: 3 },
    wash_sponge: { hygiene: 28, happiness: 4 },
    wash_toothbrush: { hygiene: 30, happiness: 5, health: 3 },
    wash_shampoo: { hygiene: 35, happiness: 5 },
    wash_spa: { hygiene: 50, happiness: 10, health: 5 },
    toy_ball: { happiness: 18, energy: -8 },
    toy_frisbee: { happiness: 22, energy: -10 },
    toy_puzzle: { happiness: 25, energy: -5, intelligence: 1 },
    toy_guitar: { happiness: 28, energy: -12, intelligence: 2 },
    toy_accordion: { happiness: 30, energy: -10, intelligence: 2 },
    toy_saxophone: { happiness: 32, energy: -15, intelligence: 3 },
    toy_drum: { happiness: 26, energy: -14 },
    toy_bicycle: { happiness: 35, energy: -20, health: 5 }
  };

  const effect = itemEffects[normalizedItemKey] ?? {};
  const deltas: Record<string, number> = {};
  const mutableStats: Array<"hunger" | "hygiene" | "happiness" | "health" | "energy"> = ["hunger", "hygiene", "happiness", "health", "energy"];

  for (const stat of mutableStats) {
    const delta = effect[stat] ?? 0;
    if (delta === 0) continue;
    const before = localStore.state[stat];
    const after = clamp(before + delta);
    localStore.state[stat] = after;
    deltas[stat] = after - before;
  }
  inventoryItem.quantity -= 1;
  if (inventoryItem.quantity <= 0) {
    localStore.inventory = localStore.inventory.filter((row) => row.item_key !== normalizedItemKey);
  }

  updateDailyFromAction(action);

  const baseRewardByAction: Record<ТипДействия, { xp: number; coins: number }> = {
    feed: { xp: 5, coins: 2 },
    wash: { xp: 5, coins: 2 },
    play: { xp: 10, coins: 5 },
    heal: { xp: 7, coins: 3 },
    chat: { xp: 4, coins: 1 },
    sleep: { xp: 10, coins: 100 },
    clean: { xp: 3, coins: 5 }
  };
  const baseReward = baseRewardByAction[action];
  const reward = gainProgress(baseReward.xp, baseReward.coins, Math.max(0, effect.intelligence ?? 0));

  localStore.state.behavior_state = определитьСостояниеПитомца(localStore.state);

  const notifications: string[] = [];
  addEventPointsLocal(EVENT_POINTS_BY_ACTION[action] ?? 0, notifications);
  if (action === "feed") addAchievementProgressLocal("feed_count_25", 1, notifications);
  if (action === "play") addAchievementProgressLocal("play_count_25", 1, notifications);
  addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

  if (localStore.state.hunger < 30) notifications.push("Дракончик Искра проголодался");
  if (reward.level_up) notifications.push("Новый уровень!");

  const event = addHistory(`use_item_${action}`, {
    item_key: normalizedItemKey,
    deltas,
    reward,
    daily: localStore.daily,
    notifications,
    stats: localStore.state
  });

  return {
    state: { ...localStore.state },
    event,
    reward,
    daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
    notifications
  };
}

function parseLimit(path: string): number {
  const parts = path.split("?");
  if (parts.length < 2) return 30;
  const params = new URLSearchParams(parts[1]);
  const raw = Number(params.get("limit") ?? "30");
  if (Number.isNaN(raw)) return 30;
  return Math.max(1, Math.min(200, raw));
}

function localClaimLoginBonus(): ОтветДействия {
  if (localStore.daily.login_bonus_claimed) {
    throw new Error(JSON.stringify({ detail: "Бонус уже получен" }));
  }

  localStore.daily.login_bonus_claimed = true;
  localStore.dailyDateKey = dateKeyNow();

  const today = dateKeyNow();
  const previous = localStore.streak.last_claim_date;

  if (!previous) {
    localStore.streak.current = 1;
  } else {
    const prevDate = new Date(`${previous}T00:00:00.000Z`);
    const curDate = new Date(`${today}T00:00:00.000Z`);
    const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000);
    localStore.streak.current = diffDays === 1 ? localStore.streak.current + 1 : 1;
  }

  localStore.streak.best = Math.max(localStore.streak.best, localStore.streak.current);
  localStore.streak.last_claim_date = today;

  const bonus = streakBonusFor(localStore.streak.current);
  const reward = gainProgress(12 + bonus.xp, 100 + bonus.coins, 0);

  const notifications = ["Бонус за вход получен", `Серия входов: ${localStore.streak.current} дней`];
  if (bonus.coins || bonus.xp) {
    const parts: string[] = [];
    if (bonus.coins) parts.push(`+${bonus.coins} монет`);
    if (bonus.xp) parts.push(`+${bonus.xp} XP`);
    notifications.push("Бонус серии: " + parts.join(", "));
  }
  if (bonus.milestone) {
    notifications.push(`Рубеж серии: ${bonus.milestone} дней`);
  }

  setAchievementProgressMaxLocal("streak_best_7", localStore.streak.best, notifications);
  setAchievementProgressMaxLocal("streak_best_30", localStore.streak.best, notifications);
  addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

  const event = addHistory("бонус_входа", { reward, daily: localStore.daily, notifications, streak: localStore.streak });
  return {
    state: { ...localStore.state },
    event,
    reward,
    daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
    notifications
  };
}

function localFallbackRequest<T>(path: string, method: string, body: unknown): T {
  ensureLocalDailyStateFresh();

  if (path.startsWith("/state") && method === "GET") {
    if (!localStore.daily.login_bonus_claimed) {
      localClaimLoginBonus();
    }
    return { ...localStore.state } as T;
  }
  if (path.startsWith("/history") && method === "GET") {
    const limit = parseLimit(path);
    return localStore.history.slice(0, limit) as T;
  }
  if (path === "/daily" && method === "GET") {
    return { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) } as T;
  }
  if (path === "/daily/claim-login" && method === "POST") {
    return localClaimLoginBonus() as T;
  }
  if (path === "/daily/claim-chest" && method === "POST") {
    if (!localStore.daily.all_completed || localStore.daily.chest_claimed) {
      throw new Error(JSON.stringify({ detail: "Сундук недоступен" }));
    }
    localStore.daily.chest_claimed = true;
    const reward = gainProgress(30, 50, 0);
    const notifications = ["Сундук заданий открыт"];
    addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

    const event = addHistory("сундук_дня", { reward, daily: localStore.daily, notifications });
    return {
      state: { ...localStore.state },
      event,
      reward,
      daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
      notifications
    } as T;
  }
  if (path === "/streak" && method === "GET") {
    return { ...localStore.streak } as T;
  }
  if (path === "/events/active" && method === "GET") {
    return { ...localStore.activeEvent } as T;
  }
  if (path === "/events/claim" && method === "POST") {
    if (!localStore.activeEvent.completed || localStore.activeEvent.claimed) {
      throw new Error(JSON.stringify({ detail: "Награда события ещё недоступна" }));
    }
    localStore.activeEvent.claimed = true;
    const reward = gainProgress(localStore.activeEvent.reward_xp, localStore.activeEvent.reward_coins, 0);
    const notifications = [
      `Награда события получена: +${localStore.activeEvent.reward_coins} монет, +${localStore.activeEvent.reward_xp} XP`
    ];
    if (reward.level_up) notifications.push("Новый уровень!");
    addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

    const event = addHistory("награда_события", {
      event_key: localStore.activeEvent.event_key,
      reward,
      notifications,
      stats: localStore.state
    });
    return {
      state: { ...localStore.state },
      event,
      reward,
      daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
      notifications
    } as T;
  }
  if (path === "/achievements" && method === "GET") {
    return listAchievementStates() as T;
  }
  if (path === "/achievements/claim" && method === "POST") {
    const parsed = body as { achievement_key?: string } | undefined;
    const achievementKey = String(parsed?.achievement_key ?? "").trim();
    const def = ACHIEVEMENT_DEFS[achievementKey];
    if (!def) {
      throw new Error(JSON.stringify({ detail: "Достижение не найдено" }));
    }
    const state = achievementState(achievementKey);
    if (!state.completed) {
      throw new Error(JSON.stringify({ detail: "Награда достижения ещё недоступна" }));
    }
    if (state.claimed) {
      throw new Error(JSON.stringify({ detail: "Награда достижения уже получена" }));
    }

    ensureAchievementRow(achievementKey).claimed = true;

    const reward = gainProgress(def.reward_xp, def.reward_coins, 0);
    const notifications = [
      `Награда достижения получена: ${def.title} (+${def.reward_coins} монет, +${def.reward_xp} XP)`
    ];
    if (reward.level_up) notifications.push("Новый уровень!");
    addAchievementProgressLocal("coins_earned_1000", reward.coins, notifications);

    const event = addHistory("награда_достижения", {
      achievement_key: achievementKey,
      reward,
      notifications,
      stats: localStore.state
    });
    return {
      state: { ...localStore.state },
      event,
      reward,
      daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
      notifications
    } as T;
  }

  if (path === "/shop/catalog" && method === "GET") {
    return localCatalog() as T;
  }
  if (path === "/inventory" && method === "GET") {
    return localStore.inventory.map((item) => ({ ...item })) as T;
  }
  if (path === "/shop/buy" && method === "POST") {
    const parsed = body as { item_key?: string } | undefined;
    return localBuy(String(parsed?.item_key ?? "")) as T;
  }
  if (path === "/use-item" && method === "POST") {
    const parsed = body as { item_key?: string } | undefined;
    return localUseItem(String(parsed?.item_key ?? "")) as T;
  }
  if (path.startsWith("/action/") && method === "POST") {
    const action = path.split("/").at(-1) as ТипДействия;
    return localAction(action) as T;
  }
  if (path === "/minigames/result" && method === "POST") {
    return localMiniGame(body as ЗапросРезультатаМиниИгры) as T;
  }
  throw new Error("Локальный fallback не поддерживает этот маршрут");
}

async function request<T>(path: string, token: string, method = "GET", body?: unknown): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(token)
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (token === LOCAL_TOKEN || isFetchLikeError(error)) {
      return localFallbackRequest<T>(path, method, body);
    }
    throw error;
  }
}

export async function авторизацияТелеграм(initData: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ init_data: initData })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  } catch (error) {
    if (isFetchLikeError(error)) {
      return LOCAL_TOKEN;
    }
    throw error;
  }
}

export function получитьСостояние(token: string): Promise<СостояниеПитомца> {
  return request<СостояниеПитомца>("/state", token);
}

export function получитьИсторию(token: string): Promise<ЗаписьСобытия[]> {
  return request<ЗаписьСобытия[]>("/history?limit=30", token);
}

export function выполнитьДействиеApi(token: string, action: ТипДействия): Promise<ОтветДействия> {
  return request<ОтветДействия>(`/action/${action}`, token, "POST");
}

export function отправитьРезультатМиниИгры(
  token: string,
  payload: ЗапросРезультатаМиниИгры
): Promise<ОтветМиниИгры> {
  return request<ОтветМиниИгры>("/minigames/result", token, "POST", payload);
}

export function получитьЗаданияДня(token: string): Promise<СостояниеЗаданий> {
  return request<СостояниеЗаданий>("/daily", token);
}

export function получитьБонусЗаВход(token: string): Promise<ОтветДействия> {
  return request<ОтветДействия>("/daily/claim-login", token, "POST");
}

export function открытьСундукДня(token: string): Promise<ОтветДействия> {
  return request<ОтветДействия>("/daily/claim-chest", token, "POST");
}

export function получитьКаталогМагазина(token: string): Promise<КаталогМагазина> {
  return request<КаталогМагазина>("/shop/catalog", token);
}

export function купитьТовар(token: string, itemKey: string): Promise<ОтветПокупки> {
  return request<ОтветПокупки>("/shop/buy", token, "POST", { item_key: itemKey });
}

export function получитьИнвентарь(token: string): Promise<ПредметИнвентаря[]> {
  return request<ПредметИнвентаря[]>("/inventory", token);
}


export function использоватьПредмет(token: string, itemKey: string): Promise<ОтветДействия> {
  return request<ОтветДействия>("/use-item", token, "POST", { item_key: itemKey });
}


export function получитьСерию(token: string): Promise<СостояниеСерии> {
  return request<СостояниеСерии>("/streak", token);
}

export function получитьАктивноеСобытие(token: string): Promise<СостояниеСобытия | null> {
  return request<СостояниеСобытия | null>("/events/active", token);
}

export function забратьНаградуСобытия(token: string): Promise<ОтветДействия> {
  return request<ОтветДействия>("/events/claim", token, "POST");
}

export function получитьДостижения(token: string): Promise<СостояниеДостижения[]> {
  return request<СостояниеДостижения[]>("/achievements", token);
}

export function забратьНаградуДостижения(token: string, achievementKey: string): Promise<ОтветДействия> {
  return request<ОтветДействия>("/achievements/claim", token, "POST", { achievement_key: achievementKey });
}

