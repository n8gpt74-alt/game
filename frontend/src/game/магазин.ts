import type { ТоварМагазина } from "../types";

export function ценаПоУровню(базоваяЦена: number, уровень: number): number {
  return Math.round(базоваяЦена * 1.8 ** Math.max(1, уровень));
}

export function сгруппироватьКаталог(товары: ТоварМагазина[]): Record<string, ТоварМагазина[]> {
  return товары.reduce<Record<string, ТоварМагазина[]>>((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});
}
