import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3
} from "three";

export type MiniGameAgeGroup = "2-4" | "5-6" | "7-8";

export type MiniGameResult3D = {
  ageGroup: MiniGameAgeGroup;
  score: number;
  xp: number;
};

export type MiniGameHudState = {
  active: boolean;
  title: string;
  score: number;
  timeLeft: number;
  result: string | null;
};

type MiniGameConfig = {
  label: string;
  targets: number;
  speed: number;
  radius: number;
  xpPerHit: number;
};

type TargetEntry = {
  mesh: Mesh;
  velocity: Vector3;
  phase: number;
};

type RuntimeState = {
  ageGroup: MiniGameAgeGroup;
  config: MiniGameConfig;
  root: Group;
  targets: TargetEntry[];
  score: number;
  endAt: number;
  resolve: (result: MiniGameResult3D) => void;
};

export interface MiniGameSystem {
  start: (ageGroup: MiniGameAgeGroup) => Promise<MiniGameResult3D>;
  update: (dt: number, now: number, elapsed: number) => void;
  onPointerDown: (event: PointerEvent) => void;
  isActive: () => boolean;
  cancel: () => void;
  dispose: () => void;
}

type MiniGameSystemOptions = {
  scene: Scene;
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  onHudChange: (hud: MiniGameHudState) => void;
  onHit?: (score: number, ageGroup: MiniGameAgeGroup) => void;
  onRoundEnd?: (result: MiniGameResult3D) => void;
};

const ROUND_MS = 20_000;
const BOUNDS = {
  minX: -1.25,
  maxX: 1.25,
  minY: 0.46,
  maxY: 1.95,
  minZ: -0.86,
  maxZ: 0.86
} as const;

const CONFIG: Record<MiniGameAgeGroup, MiniGameConfig> = {
  "2-4": { label: "2-4 года", targets: 3, speed: 0.42, radius: 0.2, xpPerHit: 4 },
  "5-6": { label: "5-6 лет", targets: 4, speed: 0.64, radius: 0.16, xpPerHit: 5 },
  "7-8": { label: "7-8 лет", targets: 6, speed: 0.9, radius: 0.13, xpPerHit: 6 }
};

const TARGET_COLORS = [0xffd8ff, 0xbde8ff, 0xfff2b8, 0xffffff];

let audioCtx: AudioContext | null = null;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function nextVelocity(): Vector3 {
  const vector = new Vector3(randomRange(-1, 1), randomRange(-0.35, 0.35), randomRange(-1, 1));
  if (vector.lengthSq() < 0.001) {
    vector.set(0.8, 0.1, -0.7);
  }
  return vector.normalize();
}

function moveInsideBounds(target: TargetEntry): void {
  target.mesh.position.set(
    randomRange(BOUNDS.minX, BOUNDS.maxX),
    randomRange(BOUNDS.minY, BOUNDS.maxY),
    randomRange(BOUNDS.minZ, BOUNDS.maxZ)
  );
  target.velocity.copy(nextVelocity());
  target.phase = randomRange(0, Math.PI * 2);
}

function safePlayTap(): void {
  try {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) {
      audioCtx = new Ctx();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1160, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // Заглушка звука: если аудио недоступно, мини-игра продолжает работать без ошибок.
  }
}

export function createMiniGameSystem(options: MiniGameSystemOptions): MiniGameSystem {
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  let runtime: RuntimeState | null = null;
  let currentPromise: Promise<MiniGameResult3D> | null = null;
  let resultTimer: number | null = null;

  const clearResultTimer = () => {
    if (resultTimer !== null) {
      window.clearTimeout(resultTimer);
      resultTimer = null;
    }
  };

  const emitHud = (hud: MiniGameHudState) => {
    options.onHudChange(hud);
  };

  const disposeRuntime = () => {
    if (!runtime) return;

    options.scene.remove(runtime.root);
    for (const target of runtime.targets) {
      target.mesh.geometry.dispose();
      const material = target.mesh.material;
      if (Array.isArray(material)) {
        for (const item of material) item.dispose();
      } else {
        material.dispose();
      }
    }

    runtime = null;
    currentPromise = null;
  };

  const finishRound = () => {
    if (!runtime) return;

    const result: MiniGameResult3D = {
      ageGroup: runtime.ageGroup,
      score: runtime.score,
      xp: runtime.score * runtime.config.xpPerHit
    };

    runtime.resolve(result);
    options.onRoundEnd?.(result);

    emitHud({
      active: false,
      title: runtime.config.label,
      score: runtime.score,
      timeLeft: 0,
      result: `Отлично! +${result.xp} опыта`
    });

    clearResultTimer();
    resultTimer = window.setTimeout(() => {
      emitHud({
        active: false,
        title: "",
        score: 0,
        timeLeft: 0,
        result: null
      });
    }, 1500);

    disposeRuntime();
  };

  const start = (ageGroup: MiniGameAgeGroup): Promise<MiniGameResult3D> => {
    if (currentPromise) return currentPromise;

    const config = CONFIG[ageGroup];

    currentPromise = new Promise<MiniGameResult3D>((resolve) => {
      const root = new Group();
      root.name = "mini-game-targets";
      options.scene.add(root);

      const targets: TargetEntry[] = [];
      for (let i = 0; i < config.targets; i += 1) {
        const material = new MeshBasicMaterial({
          color: TARGET_COLORS[i % TARGET_COLORS.length],
          transparent: true,
          opacity: 0.92,
          blending: AdditiveBlending
        });
        const mesh = new Mesh(new SphereGeometry(config.radius, 18, 18), material);
        mesh.renderOrder = 5;
        root.add(mesh);

        const entry: TargetEntry = {
          mesh,
          velocity: nextVelocity(),
          phase: randomRange(0, Math.PI * 2)
        };
        moveInsideBounds(entry);
        targets.push(entry);
      }

      runtime = {
        ageGroup,
        config,
        root,
        targets,
        score: 0,
        endAt: performance.now() + ROUND_MS,
        resolve
      };

      emitHud({
        active: true,
        title: config.label,
        score: 0,
        timeLeft: Math.ceil(ROUND_MS / 1000),
        result: null
      });
    });

    return currentPromise;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!runtime) return;

    const rect = options.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, options.camera);
    const intersections = raycaster.intersectObjects(runtime.targets.map((target) => target.mesh), false);
    if (intersections.length === 0) return;

    const hitMesh = intersections[0].object as Mesh;
    const hit = runtime.targets.find((target) => target.mesh === hitMesh);
    if (!hit) return;

    runtime.score += 1;
    moveInsideBounds(hit);
    hit.mesh.scale.setScalar(1.25);
    safePlayTap();

    options.onHit?.(runtime.score, runtime.ageGroup);

    emitHud({
      active: true,
      title: runtime.config.label,
      score: runtime.score,
      timeLeft: Math.max(0, Math.ceil((runtime.endAt - performance.now()) / 1000)),
      result: null
    });
  };

  const update = (dt: number, now: number, elapsed: number) => {
    if (!runtime) return;

    const timeLeftMs = Math.max(0, runtime.endAt - now);
    const timeLeft = Math.ceil(timeLeftMs / 1000);

    for (const target of runtime.targets) {
      target.mesh.position.addScaledVector(target.velocity, dt * runtime.config.speed);
      target.mesh.position.y += Math.sin(elapsed * 2.2 + target.phase) * dt * 0.25;
      target.mesh.rotation.y += dt * 2.8;

      const pulse = 1 + Math.sin(elapsed * 5 + target.phase) * 0.08;
      target.mesh.scale.lerp(new Vector3(pulse, pulse, pulse), Math.min(1, dt * 7));

      if (target.mesh.position.x < BOUNDS.minX || target.mesh.position.x > BOUNDS.maxX) target.velocity.x *= -1;
      if (target.mesh.position.y < BOUNDS.minY || target.mesh.position.y > BOUNDS.maxY) target.velocity.y *= -1;
      if (target.mesh.position.z < BOUNDS.minZ || target.mesh.position.z > BOUNDS.maxZ) target.velocity.z *= -1;
    }

    emitHud({
      active: true,
      title: runtime.config.label,
      score: runtime.score,
      timeLeft,
      result: null
    });

    if (timeLeftMs <= 0) {
      finishRound();
    }
  };

  const cancel = () => {
    if (!runtime) return;
    const cancelResult: MiniGameResult3D = {
      ageGroup: runtime.ageGroup,
      score: runtime.score,
      xp: runtime.score * runtime.config.xpPerHit
    };
    runtime.resolve(cancelResult);
    disposeRuntime();
    emitHud({
      active: false,
      title: "",
      score: 0,
      timeLeft: 0,
      result: null
    });
  };

  const dispose = () => {
    clearResultTimer();
    disposeRuntime();
  };

  return {
    start,
    update,
    onPointerDown,
    isActive: () => runtime !== null,
    cancel,
    dispose
  };
}
