import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { СтадияПитомца, ТипДействия } from "../types";

export type ВозрастМиниИгры = "2-4" | "5-6" | "7-8";
export type РезультатМиниИгры3D = {
  ageGroup: ВозрастМиниИгры;
  score: number;
  xp: number;
};

export type Настроение3D = "calm" | "happy" | "hungry" | "dirty" | "tired" | "sick" | "sad";

export interface Unicorn3DHandle {
  playAction: (actionName: ТипДействия) => Promise<void>;
  evolveTo: (stage: СтадияПитомца) => Promise<void>;
  startMiniGame: (ageGroup: ВозрастМиниИгры) => Promise<РезультатМиниИгры3D>;
}

type Props = {
  stage: СтадияПитомца;
  className?: string;
  activeCosmetics?: string[];
  mood?: Настроение3D;
  roomTheme?: string | null;
};

type Dragon3DComponent = ForwardRefExoticComponent<Props & RefAttributes<Unicorn3DHandle>>;

export const Unicorn3D = forwardRef<Unicorn3DHandle, Props>(function Unicorn3D(props, ref) {
  const innerRef = useRef<Unicorn3DHandle | null>(null);
  const [Loaded, setLoaded] = useState<Dragon3DComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./Dragon3D").then((mod) => {
      if (cancelled) return;
      setLoaded(() => mod.Dragon3D as unknown as Dragon3DComponent);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      playAction: (actionName) => innerRef.current?.playAction(actionName) ?? Promise.resolve(),
      evolveTo: (stage) => innerRef.current?.evolveTo(stage) ?? Promise.resolve(),
      startMiniGame: (ageGroup) => innerRef.current?.startMiniGame(ageGroup) ?? Promise.resolve({ ageGroup, score: 0, xp: 0 })
    }),
    []
  );

  if (!Loaded) {
    return <div className={props.className ?? "unicorn-3d"} data-scene-loading="true" />;
  }

  return <Loaded ref={innerRef} {...props} />;
});
