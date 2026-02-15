import type {
  КаталогМагазина,
  ОтветДействия,
  ОтветМиниИгры,
  ОтветПокупки,
  ЗаписьСобытия,
  ЗапросРезультатаМиниИгры,
  Награда,
  ПредметИнвентаря,
  СостояниеЗаданий,
  СостояниеПитомца,
  ТипДействия,
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
  { task_key: "play_count", title: "Поиграть 1 раз", target: 1, progress: 0, completed: false }
];

type ЛокальноеХранилище = {
  state: СостояниеПитомца;
  history: ЗаписьСобытия[];
  daily: СостояниеЗаданий;
  inventory: ПредметИнвентаря[];
  nextEventId: number;
};

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
    tasks: DEFAULT_DAILY_TASKS.map((task) => ({ ...task })),
    login_bonus_claimed: false,
    chest_claimed: false,
    all_completed: false
  },
  inventory: [
    { item_key: "food_apple", quantity: 8 },
    { item_key: "food_carrot", quantity: 5 },
    { item_key: "wash_soap", quantity: 5 },
    { item_key: "medicine_bandage", quantity: 3 },
    { item_key: "toy_ball", quantity: 3 }
  ],
  nextEventId: 1
};

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

  localStore.daily.tasks = localStore.daily.tasks.map((task) => {
    if (task.task_key !== taskKey) return task;
    const progress = task.progress + 1;
    return { ...task, progress, completed: progress >= task.target };
  });
  localStore.daily.all_completed = localStore.daily.tasks.every((task) => task.completed);
}

function updateDailyFromMiniGame(): void {
  localStore.daily.tasks = localStore.daily.tasks.map((task) => {
    if (task.task_key !== "minigame_count") return task;
    const progress = task.progress + 1;
    return { ...task, progress, completed: progress >= task.target };
  });
  localStore.daily.all_completed = localStore.daily.tasks.every((task) => task.completed);
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
  const isMathMiniGame = source === "math";
  const energyRecovered = isMathMiniGame ? (success ? 12 : 6) : 0;
  const reward = success ? gainProgress(15, 10, 2) : gainProgress(6, 3, 0);
  if (energyRecovered > 0) {
    localStore.state.energy = clamp(localStore.state.energy + energyRecovered);
    localStore.state.happiness = clamp(localStore.state.happiness + (success ? 4 : 2));
    localStore.state.behavior_state = определитьСостояниеПитомца(localStore.state);
  }
  updateDailyFromMiniGame();
  const notifications: string[] = [];
  if (energyRecovered > 0) notifications.push(`Энергия восстановлена: +${energyRecovered}`);
  if (reward.level_up) notifications.push("Новый уровень!");
  if (localStore.daily.tasks.find((task) => task.task_key === "minigame_count")?.completed) {
    notifications.push("Задание выполнено");
  }

  const event = addHistory("мини_игра", {
    game_type: payload.game_type,
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

  inventoryItem.quantity -= 1;
  if (inventoryItem.quantity <= 0) {
    localStore.inventory = localStore.inventory.filter((row) => row.item_key !== normalizedItemKey);
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

  return localAction(action);
}

function parseLimit(path: string): number {
  const parts = path.split("?");
  if (parts.length < 2) return 30;
  const params = new URLSearchParams(parts[1]);
  const raw = Number(params.get("limit") ?? "30");
  if (Number.isNaN(raw)) return 30;
  return Math.max(1, Math.min(200, raw));
}

function localFallbackRequest<T>(path: string, method: string, body: unknown): T {
  if (path.startsWith("/state") && method === "GET") {
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
    if (localStore.daily.login_bonus_claimed) {
      throw new Error(JSON.stringify({ detail: "Бонус уже получен" }));
    }
    localStore.daily.login_bonus_claimed = true;
    const reward = gainProgress(12, 20, 0);
    const notifications = ["Бонус за вход получен"];
    const event = addHistory("бонус_входа", { reward, daily: localStore.daily, notifications });
    return {
      state: { ...localStore.state },
      event,
      reward,
      daily: { ...localStore.daily, tasks: localStore.daily.tasks.map((task) => ({ ...task })) },
      notifications
    } as T;
  }
  if (path === "/daily/claim-chest" && method === "POST") {
    if (!localStore.daily.all_completed || localStore.daily.chest_claimed) {
      throw new Error(JSON.stringify({ detail: "Сундук недоступен" }));
    }
    localStore.daily.chest_claimed = true;
    const reward = gainProgress(30, 50, 0);
    const notifications = ["Сундук заданий открыт"];
    const event = addHistory("сундук_дня", { reward, daily: localStore.daily, notifications });
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
