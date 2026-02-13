import type { СостояниеПитомца, СтадияПитомца } from "../types";

export function опытДоСледующегоУровня(уровень: number): number {
  return Math.ceil(50 * уровень ** 1.4);
}

export function стадияПоУровню(уровень: number): СтадияПитомца {
  if (уровень <= 5) return "baby";
  if (уровень <= 10) return "child";
  if (уровень <= 20) return "teen";
  return "adult";
}

type ИтогПовышения = {
  естьПовышение: boolean;
  уровни: number[];
  новаяСтадия: boolean;
};

export function проверитьПовышениеУровня(
  до: СостояниеПитомца | null,
  после: СостояниеПитомца
): ИтогПовышения {
  if (!до) {
    return { естьПовышение: false, уровни: [], новаяСтадия: false };
  }
  const естьПовышение = после.level > до.level;
  const уровни: number[] = [];
  if (естьПовышение) {
    for (let lvl = до.level + 1; lvl <= после.level; lvl += 1) {
      уровни.push(lvl);
    }
  }
  return {
    естьПовышение,
    уровни,
    новаяСтадия: после.stage !== до.stage
  };
}
