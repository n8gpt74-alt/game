import { выполнитьДействиеApi } from "../api";
import type { FxName } from "../components/FxOverlay";
import type { Unicorn3DHandle } from "../components/Unicorn3D";
import type { ОтветДействия, СостояниеПитомца, ТипДействия } from "../types";
import { playAction, playFx, fxДляДействия } from "./анимации";
import { начислитьНаграду } from "./экономика";
import { проверитьПовышениеУровня } from "./уровни";
import { обновитьСостояниеПитомца } from "./состоянияПитомца";

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function применитьСостояниеСервера(состояние: СостояниеПитомца): СостояниеПитомца {
  const нормализованное: СостояниеПитомца = {
    ...состояние,
    hunger: clamp100(состояние.hunger),
    hygiene: clamp100(состояние.hygiene),
    happiness: clamp100(состояние.happiness),
    health: clamp100(состояние.health),
    energy: clamp100(состояние.energy)
  };
  return {
    ...нормализованное,
    behavior_state: обновитьСостояниеПитомца(нормализованное)
  };
}

type КонтекстДействия = {
  токен: string;
  питомец3d: Unicorn3DHandle | null;
  emitFx: (effect: FxName) => void;
  текущееСостояние: СостояниеПитомца | null;
};

export async function выполнитьДействие(
  тип: ТипДействия,
  контекст: КонтекстДействия
): Promise<{ ответ: ОтветДействия; прогноз: СостояниеПитомца | null }> {
  const fx = fxДляДействия(тип);
  playFx(fx, контекст.emitFx);

  const promiseAnimation = playAction(тип, контекст.питомец3d);
  const promiseApi = выполнитьДействиеApi(контекст.токен, тип);
  const [ответ] = await Promise.all([promiseApi, promiseAnimation]);

  const прогноз =
    контекст.текущееСостояние !== null ? начислитьНаграду(контекст.текущееСостояние, ответ.reward) : null;
  return { ответ, прогноз };
}

export { начислитьНаграду, проверитьПовышениеУровня, обновитьСостояниеПитомца };
