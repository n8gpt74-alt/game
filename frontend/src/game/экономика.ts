import type { Награда, СостояниеПитомца } from "../types";

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function начислитьНаграду(состояние: СостояниеПитомца, награда: Награда): СостояниеПитомца {
  return {
    ...состояние,
    xp: Math.max(0, состояние.xp + награда.xp),
    coins: Math.max(0, состояние.coins + награда.coins),
    intelligence: Math.max(0, состояние.intelligence + награда.intelligence),
    crystals: Math.max(0, состояние.crystals + награда.crystals),
    hunger: clamp100(состояние.hunger),
    hygiene: clamp100(состояние.hygiene),
    happiness: clamp100(состояние.happiness),
    health: clamp100(состояние.health),
    energy: clamp100(состояние.energy)
  };
}
