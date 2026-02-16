// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { загрузитьЛокальныйСнимок, сохранитьЛокальныйСнимок } from "./offlineCache";
import {
  выполнитьДействиеApi,
  гидратироватьЛокальныйFallback,
  получитьАктивноеСобытие,
  получитьБонусЗаВход,
  получитьДостижения,
  получитьЗаданияДня,
  получитьИнвентарь,
  получитьИсторию,
  получитьКаталогМагазина,
  получитьСерию,
  получитьСостояние
} from "./api";

const LOCAL_TOKEN = "локальный-режим";
const STORAGE_USER_ID = "test_user";

beforeAll(() => {
  // В тестах нет backend-сервера. Форсируем local fallback.
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
});

beforeEach(() => {
  window.localStorage.clear();
  гидратироватьЛокальныйFallback(null);
});

describe("offlineCache persistence", () => {
  it("persists and restores snapshot including streak/event/achievements", async () => {
    await выполнитьДействиеApi(LOCAL_TOKEN, "feed");
    await получитьБонусЗаВход(LOCAL_TOKEN);

    const [state, history, daily, catalog, inventory, streak, activeEvent, achievements] = await Promise.all([
      получитьСостояние(LOCAL_TOKEN),
      получитьИсторию(LOCAL_TOKEN),
      получитьЗаданияДня(LOCAL_TOKEN),
      получитьКаталогМагазина(LOCAL_TOKEN),
      получитьИнвентарь(LOCAL_TOKEN),
      получитьСерию(LOCAL_TOKEN),
      получитьАктивноеСобытие(LOCAL_TOKEN),
      получитьДостижения(LOCAL_TOKEN)
    ]);

    сохранитьЛокальныйСнимок(STORAGE_USER_ID, {
      state,
      history,
      daily,
      catalog,
      inventory,
      streak,
      activeEvent,
      achievements,
      savedAt: new Date("2026-02-15T00:00:00.000Z").toISOString()
    });

    const loaded = загрузитьЛокальныйСнимок(STORAGE_USER_ID);
    expect(loaded).not.toBeNull();
    expect(loaded?.streak?.current).toBe(streak.current);
    expect(loaded?.achievements.length).toBeGreaterThan(0);

    гидратироватьЛокальныйFallback(
      loaded
        ? {
            state: loaded.state,
            history: loaded.history,
            daily: loaded.daily,
            inventory: loaded.inventory,
            streak: loaded.streak,
            activeEvent: loaded.activeEvent,
            achievements: loaded.achievements
          }
        : null
    );

    const [streak2, activeEvent2, achievements2] = await Promise.all([
      получитьСерию(LOCAL_TOKEN),
      получитьАктивноеСобытие(LOCAL_TOKEN),
      получитьДостижения(LOCAL_TOKEN)
    ]);

    expect(streak2.current).toBe(streak.current);
    expect(activeEvent2?.progress_points).toBe(activeEvent?.progress_points);

    const feedAchievement = achievements.find((row) => row.achievement_key === "feed_count_25");
    const feedAchievement2 = achievements2.find((row) => row.achievement_key === "feed_count_25");
    expect(feedAchievement2?.progress).toBe(feedAchievement?.progress);
  });
});
