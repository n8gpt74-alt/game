import type { FxName } from "../components/FxOverlay";
import type { Unicorn3DHandle } from "../components/Unicorn3D";
import type { ТипДействия } from "../types";

const FX_BY_ACTION: Record<ТипДействия, FxName> = {
  feed: "hearts",
  wash: "bubbles",
  play: "sparkles",
  heal: "healPlus",
  chat: "hornGlow",
  sleep: "sparkles",
  clean: "bubbles"
};

export function playFx(effectName: FxName, emitFx: (effect: FxName) => void): void {
  emitFx(effectName);
}

export async function playAction(actionName: ТипДействия, unicorn: Unicorn3DHandle | null): Promise<void> {
  if (!unicorn) return;
  await unicorn.playAction(actionName);
}

export function fxДляДействия(actionName: ТипДействия): FxName {
  return FX_BY_ACTION[actionName];
}
