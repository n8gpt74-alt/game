import type {
  КаталогМагазина,
  ЗаписьСобытия,
  ПредметИнвентаря,
  СостояниеДостижения,
  СостояниеЗаданий,
  СостояниеПитомца,
  СостояниеСерии,
  СостояниеСобытия
} from "./types";

export type ЛокальныйСнимок = {
  state: СостояниеПитомца | null;
  history: ЗаписьСобытия[];
  daily: СостояниеЗаданий | null;
  daily_date_key?: string | null;
  catalog: КаталогМагазина;
  inventory: ПредметИнвентаря[];
  streak: СостояниеСерии | null;
  activeEvent: СостояниеСобытия | null;
  achievements: СостояниеДостижения[];
  savedAt: string;
};

const SNAPSHOT_PREFIX = "дракончик_искра_кэш_v2:";

const LEGACY_SNAPSHOT_KEY = "дракончик_искра_кэш_v1";
const SNAPSHOT_SCHEMA_VERSION = 2;

function snapshotKey(storageUserId: string): string {
  return `${SNAPSHOT_PREFIX}${storageUserId}`;
}
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function загрузитьЛокальныйСнимок(storageUserId: string): ЛокальныйСнимок | null {
  try {
    const raw =
      window.localStorage.getItem(snapshotKey(storageUserId)) ??
      window.localStorage.getItem(LEGACY_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isObject(parsed)) return null;
    return {
      state: (parsed.state as СостояниеПитомца | null) ?? null,
      history: Array.isArray(parsed.history) ? (parsed.history as ЗаписьСобытия[]) : [],
      daily: (parsed.daily as СостояниеЗаданий | null) ?? null,
      daily_date_key: typeof parsed.daily_date_key === "string" ? parsed.daily_date_key : null,
      catalog: (parsed.catalog as КаталогМагазина) ?? { items: [] },
      inventory: Array.isArray(parsed.inventory) ? (parsed.inventory as ПредметИнвентаря[]) : [],
      streak: (parsed.streak as СостояниеСерии | null) ?? null,
      activeEvent: (parsed.activeEvent as СостояниеСобытия | null) ?? null,
      achievements: Array.isArray(parsed.achievements) ? (parsed.achievements as СостояниеДостижения[]) : [],
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date(0).toISOString()
    };
  } catch {
    return null;
  }
}

export function сохранитьЛокальныйСнимок(storageUserId: string, snapshot: ЛокальныйСнимок): void {
  try {
    window.localStorage.setItem(snapshotKey(storageUserId), JSON.stringify({ ...snapshot, schemaVersion: SNAPSHOT_SCHEMA_VERSION }));
  } catch {
    // Если localStorage недоступен, продолжаем без офлайн-кэша.
  }
}

