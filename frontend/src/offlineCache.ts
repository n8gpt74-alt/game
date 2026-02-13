import type {
  КаталогМагазина,
  ЗаписьСобытия,
  ПредметИнвентаря,
  СостояниеЗаданий,
  СостояниеПитомца
} from "./types";

export type ЛокальныйСнимок = {
  state: СостояниеПитомца | null;
  history: ЗаписьСобытия[];
  daily: СостояниеЗаданий | null;
  catalog: КаталогМагазина;
  inventory: ПредметИнвентаря[];
  savedAt: string;
};

const SNAPSHOT_KEY = "дракончик_искра_кэш_v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function загрузитьЛокальныйСнимок(): ЛокальныйСнимок | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) return null;
    return {
      state: (parsed.state as СостояниеПитомца | null) ?? null,
      history: Array.isArray(parsed.history) ? (parsed.history as ЗаписьСобытия[]) : [],
      daily: (parsed.daily as СостояниеЗаданий | null) ?? null,
      catalog: (parsed.catalog as КаталогМагазина) ?? { items: [] },
      inventory: Array.isArray(parsed.inventory) ? (parsed.inventory as ПредметИнвентаря[]) : [],
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date(0).toISOString()
    };
  } catch {
    return null;
  }
}

export function сохранитьЛокальныйСнимок(snapshot: ЛокальныйСнимок): void {
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Если localStorage недоступен, продолжаем без офлайн-кэша.
  }
}

