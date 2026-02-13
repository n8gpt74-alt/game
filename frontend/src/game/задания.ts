import type { СостояниеЗаданий } from "../types";

export function процентВыполненияЗаданий(состояние: СостояниеЗаданий | null): number {
  if (!состояние || состояние.tasks.length === 0) return 0;
  const completed = состояние.tasks.filter((task) => task.completed).length;
  return Math.round((completed / состояние.tasks.length) * 100);
}

export function естьНевзятыеНаграды(состояние: СостояниеЗаданий | null): boolean {
  if (!состояние) return false;
  if (!состояние.login_bonus_claimed) return true;
  return состояние.all_completed && !состояние.chest_claimed;
}
