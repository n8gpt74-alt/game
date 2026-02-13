import type { СостояниеAI, СостояниеПитомца } from "../types";

type БазаСтатов = Pick<СостояниеПитомца, "hunger" | "energy" | "hygiene" | "health" | "happiness">;

export function обновитьСостояниеПитомца(статы: БазаСтатов): СостояниеAI {
  if (статы.hunger < 30) return "Голодный";
  if (статы.energy < 20) return "Уставший";
  if (статы.hygiene < 30) return "Грязный";
  if (статы.health < 40) return "Больной";
  if (статы.happiness > 80) return "Радостный";
  if (статы.happiness < 35) return "Грустный";
  if (статы.happiness > 65 && статы.energy > 60) return "Игривый";
  if (статы.energy > 55 && статы.health > 60) return "Любопытный";
  return "Спокойный";
}
