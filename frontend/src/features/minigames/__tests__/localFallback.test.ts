// @vitest-environment jsdom

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  гидратироватьЛокальныйFallback,
  отправитьРезультатМиниИгры,
  получитьДостижения,
  получитьЗаданияДня,
  получитьСостояние
} from "../../../api";

const LOCAL_TOKEN = "локальный-режим";

function taskProgress(daily: Awaited<ReturnType<typeof получитьЗаданияДня>>, taskKey: string): number {
  return daily.tasks.find((task) => task.task_key === taskKey)?.progress ?? 0;
}

function achievementProgress(
  achievements: Awaited<ReturnType<typeof получитьДостижения>>,
  achievementKey: string
): number {
  return achievements.find((row) => row.achievement_key === achievementKey)?.progress ?? 0;
}

beforeAll(() => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
});

beforeEach(() => {
  гидратироватьЛокальныйFallback(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("local fallback minigame category split", () => {
  it("increments math and letters progress independently", async () => {
    const mathResult = await отправитьРезультатМиниИгры(LOCAL_TOKEN, {
      game_type: "sub_1_5",
      score: 4,
      elapsed_ms: 2000,
      source: "math"
    });
    expect(mathResult.event.payload.category).toBe("math");

    const lettersResult = await отправитьРезультатМиниИгры(LOCAL_TOKEN, {
      game_type: "ru_first_letter_word",
      score: 4,
      elapsed_ms: 2200,
      source: "math"
    });
    expect(lettersResult.event.payload.category).toBe("letters");

    const daily = await получитьЗаданияДня(LOCAL_TOKEN);
    expect(taskProgress(daily, "minigame_count")).toBe(2);
    expect(taskProgress(daily, "math_minigame_count")).toBe(1);
    expect(taskProgress(daily, "letters_game_count")).toBe(1);

    const achievements = await получитьДостижения(LOCAL_TOKEN);
    expect(achievementProgress(achievements, "minigame_count_20")).toBe(2);
    expect(achievementProgress(achievements, "math_minigame_count_20")).toBe(1);
    expect(achievementProgress(achievements, "letters_game_count_20")).toBe(1);
  });

  it("keeps split counters unchanged for 3d source", async () => {
    const result = await отправитьРезультатМиниИгры(LOCAL_TOKEN, {
      game_type: "count_2_4",
      score: 5,
      elapsed_ms: 1800,
      source: "3d"
    });

    expect(result.event.payload.category).toBe("3d");

    const daily = await получитьЗаданияДня(LOCAL_TOKEN);
    expect(taskProgress(daily, "minigame_count")).toBe(1);
    expect(taskProgress(daily, "math_minigame_count")).toBe(0);
    expect(taskProgress(daily, "letters_game_count")).toBe(0);

    const achievements = await получитьДостижения(LOCAL_TOKEN);
    expect(achievementProgress(achievements, "minigame_count_20")).toBe(1);
    expect(achievementProgress(achievements, "math_minigame_count_20")).toBe(0);
    expect(achievementProgress(achievements, "letters_game_count_20")).toBe(0);
  });


  it("auto-claims 100 coins on state request and resets daily data next day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T09:00:00.000Z"));
    гидратироватьЛокальныйFallback(null);

    const firstState = await получитьСостояние(LOCAL_TOKEN);
    const firstDaily = await получитьЗаданияДня(LOCAL_TOKEN);
    expect(firstState.coins).toBeGreaterThanOrEqual(1100);
    expect(firstDaily.login_bonus_claimed).toBe(true);

    const secondState = await получитьСостояние(LOCAL_TOKEN);
    expect(secondState.coins).toBe(firstState.coins);

    await отправитьРезультатМиниИгры(LOCAL_TOKEN, {
      game_type: "sub_1_5",
      score: 4,
      elapsed_ms: 2000,
      source: "math"
    });
    const progressToday = await получитьЗаданияДня(LOCAL_TOKEN);
    expect(taskProgress(progressToday, "minigame_count")).toBe(1);

    vi.setSystemTime(new Date("2026-03-02T09:00:00.000Z"));

    const newDayDailyBeforeState = await получитьЗаданияДня(LOCAL_TOKEN);
    expect(newDayDailyBeforeState.login_bonus_claimed).toBe(false);
    expect(taskProgress(newDayDailyBeforeState, "minigame_count")).toBe(0);

    const newDayState = await получитьСостояние(LOCAL_TOKEN);
    const newDayDailyAfterState = await получитьЗаданияДня(LOCAL_TOKEN);
    expect(newDayState.coins).toBeGreaterThanOrEqual(secondState.coins + 100);
    expect(newDayDailyAfterState.login_bonus_claimed).toBe(true);
  });
});
