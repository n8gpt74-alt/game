import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  Clock,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  Scene,
  ShadowMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { СтадияПитомца, ТипДействия } from "../types";
import type { Настроение3D } from "./Unicorn3D";
import { createParticlesSystem, type ParticleSystem } from "./particlesSystem";
import { visualEffects } from "../effects";

type ActionConfig = { durationMs: number };
export type ВозрастМиниИгры = "2-4" | "5-6" | "7-8";
export type РезультатМиниИгры3D = {
  ageGroup: ВозрастМиниИгры;
  score: number;
  xp: number;
};

type MiniGameConfig = {
  targets: number;
  speed: number;
  radius: number;
  xpPerHit: number;
  label: string;
};

type MiniGameTarget = {
  mesh: Mesh;
  velocity: Vector3;
  phase: number;
};

type MiniGameRuntime = {
  ageGroup: ВозрастМиниИгры;
  config: MiniGameConfig;
  root: Group;
  targets: MiniGameTarget[];
  score: number;
  endAt: number;
  resolve: (value: РезультатМиниИгры3D) => void;
};

const MODEL_URL = "/assets/models/cute_dragon_3d_model_glb.glb";
const FALLBACK_MODEL_URLS = [MODEL_URL, "/assets/models/unicorn.glb", "/assets/models/unicorn_placeholder.glb"];

const ACTION_CONFIG: Record<ТипДействия, ActionConfig> = {
  feed: { durationMs: 900 },
  wash: { durationMs: 1000 },
  play: { durationMs: 1200 },
  heal: { durationMs: 1100 },
  chat: { durationMs: 850 },
  sleep: { durationMs: 1500 },
  clean: { durationMs: 950 }
};

const CONFIG = {
  renderer: {
    exposure: 0.98
  },
  model: {
    targetHeight: 1.2
  },
  camera: {
    fitOffset: 1.12,
    minNear: 0.05,
    minFar: 30,
    defaultZ: 3.6
  },
  lights: {
    hemiIntensity: 0.6,
    keyIntensity: 1.2,
    keyColor: 0xfff2e2,
    fillIntensity: 0.35,
    fillColor: 0xa8d5ff,
    rimIntensity: 0.34,
    rimColor: 0xffb3e6,
    movingMin: 0.2,
    movingMax: 0.35,
    movingColor: 0xffd9bf,
    glowIntensity: 0.0,
    keyShadowMapSize: 2048
  },
  floor: {
    color: 0x8a94d6,
    shadowOpacity: 0.25
  },
  actionGlow: {
    maxIntensity: 0.6
  }
} as const;

const MINI_GAME_CONFIG: Record<ВозрастМиниИгры, MiniGameConfig> = {
  "2-4": { targets: 3, speed: 0.4, radius: 0.18, xpPerHit: 4, label: "2-4 года" },
  "5-6": { targets: 4, speed: 0.6, radius: 0.15, xpPerHit: 5, label: "5-6 лет" },
  "7-8": { targets: 6, speed: 0.85, radius: 0.12, xpPerHit: 6, label: "7-8 лет" }
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.max(minValue, Math.min(maxValue, value));
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function playTapSoundStub(): void {
  try {
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(860, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // Звуковая заглушка: если аудио недоступно, игра продолжает работать.
  }
}

function stageTitle(stage: СтадияПитомца): string {
  if (stage === "baby") return "Малыш";
  if (stage === "child") return "Ребёнок";
  if (stage === "teen") return "Подросток";
  return "Взрослый";
}

function createBlinkTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Не удалось создать текстуру моргания");
  }

  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = "rgba(48,30,78,0.94)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(12, 28);
  ctx.quadraticCurveTo(20, 22, 28, 28);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(36, 28);
  ctx.quadraticCurveTo(44, 22, 52, 28);
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Создание простого дерева
// Создание реалистичного дерева
function createTree(x: number, z: number, scale: number): Group {
  const tree = new Group();
  
  // Вариация цветов для естественности
  const trunkColorVariation = Math.random() * 0.1;
  const foliageColorVariation = Math.random() * 0.15;
  
  // Ствол с текстурой коры
  const trunkGeometry = new CylinderGeometry(
    0.08 * scale, 
    0.14 * scale, 
    0.9 * scale, 
    12
  );
  const trunkMaterial = new MeshStandardMaterial({ 
    color: new Color(0.29 + trunkColorVariation, 0.22 + trunkColorVariation, 0.16),
    roughness: 0.95,
    metalness: 0
  });
  const trunk = new Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.45 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // Крона - более пышная и реалистичная (4 уровня)
  const baseFoliageColor = new Color(0.18 + foliageColorVariation, 0.31 + foliageColorVariation, 0.09);
  
  // Нижний уровень кроны - самый широкий
  const foliage1Material = new MeshStandardMaterial({ 
    color: baseFoliageColor.clone().multiplyScalar(0.85),
    roughness: 0.85,
    metalness: 0
  });
  const foliage1 = new Mesh(
    new ConeGeometry(0.45 * scale, 0.65 * scale, 10), 
    foliage1Material
  );
  foliage1.position.y = 1.05 * scale;
  foliage1.castShadow = true;
  foliage1.rotation.y = Math.random() * Math.PI;
  tree.add(foliage1);
  
  // Второй уровень
  const foliage2Material = new MeshStandardMaterial({ 
    color: baseFoliageColor.clone(),
    roughness: 0.8,
    metalness: 0
  });
  const foliage2 = new Mesh(
    new ConeGeometry(0.38 * scale, 0.55 * scale, 10), 
    foliage2Material
  );
  foliage2.position.y = 1.45 * scale;
  foliage2.castShadow = true;
  foliage2.rotation.y = Math.random() * Math.PI;
  tree.add(foliage2);
  
  // Третий уровень
  const foliage3Material = new MeshStandardMaterial({ 
    color: baseFoliageColor.clone().multiplyScalar(1.1),
    roughness: 0.75,
    metalness: 0
  });
  const foliage3 = new Mesh(
    new ConeGeometry(0.28 * scale, 0.45 * scale, 10), 
    foliage3Material
  );
  foliage3.position.y = 1.8 * scale;
  foliage3.castShadow = true;
  foliage3.rotation.y = Math.random() * Math.PI;
  tree.add(foliage3);
  
  // Верхушка - острая
  const foliage4Material = new MeshStandardMaterial({ 
    color: baseFoliageColor.clone().multiplyScalar(1.15),
    roughness: 0.7,
    metalness: 0
  });
  const foliage4 = new Mesh(
    new ConeGeometry(0.18 * scale, 0.35 * scale, 8), 
    foliage4Material
  );
  foliage4.position.y = 2.1 * scale;
  foliage4.castShadow = true;
  tree.add(foliage4);
  
  // Небольшой наклон для естественности
  tree.rotation.z = (Math.random() - 0.5) * 0.08;
  tree.position.set(x, 0, z);
  return tree;
}

// Создание реалистичного куста травы
function createGrassPatch(x: number, z: number): Group {
  const patch = new Group();
  
  // Вариация цвета травы
  const grassColorVariation = Math.random() * 0.1;
  const grassColor = new Color(0.29 + grassColorVariation, 0.49 + grassColorVariation, 0.17);
  
  const grassMaterial = new MeshStandardMaterial({ 
    color: grassColor,
    roughness: 0.9,
    metalness: 0,
    side: 2 // DoubleSide
  });
  
  // Больше травинок для пышности
  const bladeCount = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < bladeCount; i++) {
    const height = 0.12 + Math.random() * 0.08;
    const width = 0.04 + Math.random() * 0.02;
    
    const blade = new Mesh(
      new PlaneGeometry(width, height),
      grassMaterial
    );
    
    blade.position.set(
      (Math.random() - 0.5) * 0.15,
      height / 2,
      (Math.random() - 0.5) * 0.15
    );
    blade.rotation.y = Math.random() * Math.PI * 2;
    blade.rotation.x = (Math.random() - 0.5) * 0.3;
    blade.rotation.z = (Math.random() - 0.5) * 0.2;
    patch.add(blade);
  }
  
  patch.position.set(x, 0.001, z);
  return patch;
}

// Создание цветка
function createFlower(x: number, z: number): Group {
  const flower = new Group();
  
  // Стебель
  const stemGeometry = new CylinderGeometry(0.01, 0.015, 0.15, 6);
  const stemMaterial = new MeshStandardMaterial({ 
    color: 0x2d5016,
    roughness: 0.8
  });
  const stem = new Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.075;
  flower.add(stem);
  
  // Цветок (случайный цвет)
  const flowerColors = [0xff6b9d, 0xffd93d, 0x6bcfff, 0xff9b85, 0xc77dff];
  const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
  
  const petalGeometry = new SphereGeometry(0.04, 8, 8);
  const petalMaterial = new MeshStandardMaterial({ 
    color: flowerColor,
    roughness: 0.6,
    metalness: 0.1
  });
  
  // 5 лепестков
  for (let i = 0; i < 5; i++) {
    const petal = new Mesh(petalGeometry, petalMaterial);
    const angle = (i / 5) * Math.PI * 2;
    petal.position.set(
      Math.cos(angle) * 0.03,
      0.15,
      Math.sin(angle) * 0.03
    );
    petal.scale.set(0.8, 0.6, 0.8);
    flower.add(petal);
  }
  
  // Центр цветка
  const center = new Mesh(
    new SphereGeometry(0.02, 8, 8),
    new MeshStandardMaterial({ color: 0xffd93d, roughness: 0.5 })
  );
  center.position.y = 0.15;
  flower.add(center);
  
  flower.position.set(x, 0, z);
  return flower;
}

// Создание лесной сцены
function createForestEnvironment(scene: Scene): void {
  const envGroup = new Group();
  
  // Деревья на заднем плане (дальше и меньше) - больше деревьев
  const backTrees = [
    { x: -2.8, z: -3.5, scale: 0.75 },
    { x: -2.2, z: -4, scale: 0.7 },
    { x: -1.2, z: -3.8, scale: 0.8 },
    { x: -0.3, z: -4.2, scale: 0.65 },
    { x: 0.8, z: -3.9, scale: 0.75 },
    { x: 1.6, z: -3.5, scale: 0.7 },
    { x: 2.4, z: -4, scale: 0.8 },
    { x: 3, z: -3.6, scale: 0.7 }
  ];
  
  backTrees.forEach(({ x, z, scale }) => {
    const tree = createTree(x, z, scale);
    envGroup.add(tree);
  });
  
  // Деревья по бокам (ближе и крупнее)
  const sideTrees = [
    { x: -2.9, z: -1.2, scale: 1.3 },
    { x: -2.6, z: 0.3, scale: 1.2 },
    { x: -2.8, z: 1.5, scale: 1.1 },
    { x: 2.6, z: -1, scale: 1.25 },
    { x: 2.9, z: 0.6, scale: 1.15 },
    { x: 2.7, z: 1.8, scale: 1.2 }
  ];
  
  sideTrees.forEach(({ x, z, scale }) => {
    const tree = createTree(x, z, scale);
    envGroup.add(tree);
  });
  
  // Трава на переднем плане - больше кустов
  for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 5;
    const z = (Math.random() - 0.5) * 4;
    // Не размещаем траву в центре (где дракончик)
    if (Math.abs(x) > 0.9 || Math.abs(z) > 0.9) {
      const grass = createGrassPatch(x, z);
      envGroup.add(grass);
    }
  }
  
  // Цветы для красоты
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * 4.5;
    const z = (Math.random() - 0.5) * 3.5;
    // Не размещаем цветы в центре
    if (Math.abs(x) > 1 || Math.abs(z) > 1) {
      const flower = createFlower(x, z);
      envGroup.add(flower);
    }
  }
  
  scene.add(envGroup);
}

function createGradientBackgroundTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Не удалось создать canvas context для фона");
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  // Небо - более реалистичное
  gradient.addColorStop(0, "#87CEEB");      // Небесно-голубой
  gradient.addColorStop(0.25, "#B0E0E6");   // Светло-голубой (горизонт)
  // Дальний лес (горы)
  gradient.addColorStop(0.35, "#4A7C59");   // Серо-зелёный (дальние деревья)
  gradient.addColorStop(0.45, "#2F5233");   // Тёмно-зелёный лес
  // Ближний лес
  gradient.addColorStop(0.55, "#1E3A20");   // Очень тёмный лес
  gradient.addColorStop(0.65, "#2D5016");   // Переход к траве
  // Трава - многослойная
  gradient.addColorStop(0.75, "#4A7C2C");   // Средняя трава
  gradient.addColorStop(0.85, "#5C8A3A");   // Светлая трава
  gradient.addColorStop(1, "#6B9B47");      // Яркая трава на переднем плане
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function buildPrimitiveUnicorn(): Group {
  const root = new Group();

  const bodyMat = new MeshStandardMaterial({ color: 0xff9be1, roughness: 0.38, metalness: 0.06 });
  const maneMat = new MeshStandardMaterial({ color: 0x8dc6ff, roughness: 0.34, metalness: 0.08 });
  const hornMat = new MeshStandardMaterial({ color: 0xffd45f, roughness: 0.25, metalness: 0.45 });

  const body = new Mesh(new SphereGeometry(0.55, 24, 16), bodyMat);
  body.position.set(0, 0.9, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  const head = new Mesh(new SphereGeometry(0.35, 24, 16), bodyMat);
  head.position.set(0.45, 1.15, 0);
  head.castShadow = true;
  root.add(head);

  const horn = new Mesh(new SphereGeometry(0.08, 8, 8), hornMat);
  horn.position.set(0.67, 1.48, 0);
  horn.scale.set(0.5, 1.8, 0.5);
  horn.castShadow = true;
  root.add(horn);

  const mane = new Mesh(new SphereGeometry(0.26, 16, 12), maneMat);
  mane.position.set(0.14, 1.3, -0.2);
  mane.scale.set(0.8, 1.1, 0.8);
  mane.castShadow = true;
  root.add(mane);

  for (let i = 0; i < 4; i += 1) {
    const leg = new Mesh(new SphereGeometry(0.14, 12, 10), bodyMat);
    leg.scale.set(0.6, 1.75, 0.6);
    leg.castShadow = true;
    leg.position.set(i < 2 ? -0.2 : 0.26, 0.35, i % 2 === 0 ? -0.18 : 0.18);
    root.add(leg);
  }

  root.position.set(0, -0.15, 0);
  return root;
}

function normalizeToFloorAndHeight(model: Group, targetHeight: number): void {
  const size = new Vector3();
  const center = new Vector3();
  const box = new Box3().setFromObject(model);
  box.getSize(size);
  box.getCenter(center);

  const sourceHeight = Math.max(size.y, 0.0001);
  const scale = targetHeight / sourceHeight;
  model.scale.multiplyScalar(scale);

  const normalizedBox = new Box3().setFromObject(model);
  const normalizedCenter = new Vector3();
  normalizedBox.getCenter(normalizedCenter);

  model.position.x -= normalizedCenter.x;
  model.position.z -= normalizedCenter.z;
  model.position.y -= normalizedBox.min.y;
}

function snapToGround(object: Group, yOffset = 0.02): void {
  const box = new Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const worldDelta = -box.min.y + yOffset;
  if (Math.abs(worldDelta) < 1e-6) return;

  const parentScale = new Vector3(1, 1, 1);
  if (object.parent) {
    object.parent.getWorldScale(parentScale);
  }
  const scaleY = Math.abs(parentScale.y) > 1e-6 ? parentScale.y : 1;
  object.position.y += worldDelta / scaleY;
}

function fitCameraToObject(camera: PerspectiveCamera, object: Group, fitOffset: number): void {
  const box = new Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
  const fitWidthDistance = fitHeightDistance / Math.max(camera.aspect, 0.1);
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance, CONFIG.camera.defaultZ);

  camera.position.set(center.x, center.y + size.y * 0.08, center.z + distance);
  camera.near = Math.max(CONFIG.camera.minNear, distance / 100);
  camera.far = Math.max(CONFIG.camera.minFar, distance * 20);
  camera.lookAt(center.x, center.y, center.z);
  camera.updateProjectionMatrix();
}

function applyStageScale(stageRoot: Group, stage: СтадияПитомца): void {
  let scale = 1;
  if (stage === "baby") scale = 0.86;
  if (stage === "child") scale = 0.93;
  if (stage === "teen") scale = 1;
  if (stage === "adult") scale = 1.17;
  stageRoot.scale.setScalar(scale);
}

function prepareMeshMaterial(mesh: Mesh, renderer: WebGLRenderer): void {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  for (const material of materials) {
    if (!material) continue;
    const textured = material as MeshStandardMaterial & {
      map?: { colorSpace: typeof SRGBColorSpace; anisotropy: number; needsUpdate: boolean };
    };
    if (textured.map) {
      textured.map.colorSpace = SRGBColorSpace;
      textured.map.anisotropy = maxAnisotropy;
      textured.map.needsUpdate = true;
    }

    if ((material as MeshStandardMaterial).isMeshStandardMaterial) {
      const pbr = material as MeshStandardMaterial & { envMapIntensity?: number };
      pbr.roughness = clamp(pbr.roughness, 0.25, 0.95);
      pbr.metalness = clamp(pbr.metalness, 0.0, 0.25);
      if (typeof pbr.envMapIntensity === "number") {
        pbr.envMapIntensity = 0.8;
      }
    }

    if ((material as MeshPhysicalMaterial).isMeshPhysicalMaterial) {
      const physical = material as MeshPhysicalMaterial;
      if (physical.transmission > 0) {
        physical.transmission = 0;
      }
      if (physical.thickness > 0) {
        physical.thickness = 0;
      }
    }

    material.needsUpdate = true;
  }
}

export interface Dragon3DHandle {
  playAction: (actionName: ТипДействия) => Promise<void>;
  evolveTo: (stage: СтадияПитомца) => Promise<void>;
  startMiniGame: (ageGroup: ВозрастМиниИгры) => Promise<РезультатМиниИгры3D>;
}

type Props = {
  stage: СтадияПитомца;
  className?: string;
  activeCosmetics?: string[];
  roomTheme?: string | null;
  mood?: Настроение3D;
};

function очиститьГруппу(root: Group): void {
  const stack = [...root.children];
  while (stack.length > 0) {
    const child = stack.pop();
    if (!child) continue;
    if ("children" in child && child.children.length > 0) {
      stack.push(...child.children);
    }
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const item of mat) item.dispose();
      } else {
        mat.dispose();
      }
    }
  }
  root.clear();
}

export const Dragon3D = forwardRef<Dragon3DHandle, Props>(function Dragon3D(
  { stage, className, activeCosmetics = [], roomTheme = null, mood = "calm" },
  ref
) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const clockRef = useRef<Clock | null>(null);
  const stageRootRef = useRef<Group | null>(null);
  const modelRootRef = useRef<Group | null>(null);
  const cosmeticsRootRef = useRef<Group | null>(null);
  const floorMaterialRef = useRef<MeshStandardMaterial | null>(null);
  const applyCosmeticsRef = useRef<(keys: string[]) => void>(() => undefined);
  const applyThemeRef = useRef<(theme: string | null) => void>(() => undefined);
  const modelBaseScaleRef = useRef(new Vector3(1, 1, 1));
  const modelBaseYRef = useRef<number>(0);
  const particlesRef = useRef<ParticleSystem | null>(null);
  const hemiLightRef = useRef<HemisphereLight | null>(null);
  const movingLightRef = useRef<PointLight | null>(null);
  const glowLightRef = useRef<PointLight | null>(null);
  const glowPulseRef = useRef<{ startAt: number; durationMs: number; peak: number } | null>(null);
  const blinkMaterialRef = useRef<SpriteMaterial | null>(null);
  const blinkTextureRef = useRef<CanvasTexture | null>(null);
  const blinkStateRef = useRef({
    active: false,
    startedAt: 0,
    durationMs: 95,
    doublePending: false,
    nextAt: performance.now() + randomRange(2200, 3600),
    amount: 0
  });
  const chatBlinkBoostUntilRef = useRef(0);
  const miniGameRef = useRef<MiniGameRuntime | null>(null);
  const miniGamePromiseRef = useRef<Promise<РезультатМиниИгры3D> | null>(null);
  const miniGameTimerRef = useRef<number | null>(null);
  const raycasterRef = useRef(new Raycaster());
  const pointerRef = useRef(new Vector2());
  const actionRunningRef = useRef(false);
  const idleWeightRef = useRef(1);
  const moodRef = useRef<Настроение3D>(mood);
  const lookStateRef = useRef({
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    nextAt: performance.now() + randomRange(2400, 4600)
  });
  const jumpStateRef = useRef({
    active: false,
    startAt: 0,
    durationMs: 760,
    nextAt: performance.now() + randomRange(10_000, 15_000)
  });
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const rafRef = useRef<number>(0);
  const resizeTimerRef = useRef<number | null>(null);
  const [miniHud, setMiniHud] = useState<{ active: boolean; label: string; score: number; timeLeft: number; result: string | null }>({
    active: false,
    label: "",
    score: 0,
    timeLeft: 0,
    result: null
  });
  const [evolveOverlay, setEvolveOverlay] = useState<{ visible: boolean; title: string }>({ visible: false, title: "" });

  useEffect(() => {
    applyCosmeticsRef.current(activeCosmetics);
  }, [activeCosmetics]);

  useEffect(() => {
    applyThemeRef.current(roomTheme);
  }, [roomTheme]);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    const stageRoot = stageRootRef.current;
    if (!stageRoot) return;
    applyStageScale(stageRoot, stage);
    const camera = cameraRef.current;
    const model = modelRootRef.current;
    if (model) {
      snapToGround(model);
      modelBaseYRef.current = model.position.y;
    }
    if (camera && model) {
      fitCameraToObject(camera, model, CONFIG.camera.fitOffset);
    }
  }, [stage]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.renderer.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    (renderer as WebGLRenderer & { physicallyCorrectLights?: boolean }).physicallyCorrectLights = true;
    renderer.setClearColor(new Color(0x000000), 0);
    renderer.domElement.style.touchAction = "none";
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new Scene();
    scene.background = createGradientBackgroundTexture();
    sceneRef.current = scene;
    const worldRoot = new Group();
    scene.add(worldRoot);
    
    // Добавляем лес и траву
    createForestEnvironment(scene);

    const camera = new PerspectiveCamera(34, 1, CONFIG.camera.minNear, CONFIG.camera.minFar);
    camera.position.set(0, 1.0, CONFIG.camera.defaultZ);
    camera.lookAt(0, 0.6, 0);
    cameraRef.current = camera;
    clockRef.current = new Clock();

    // Инициализация системы визуальных эффектов
    visualEffects.initialize(scene, camera);
    visualEffects.start();

    const hemi = new HemisphereLight(0xffffff, 0xd18fe0, CONFIG.lights.hemiIntensity);
    scene.add(hemi);
    hemiLightRef.current = hemi;

    const key = new DirectionalLight(CONFIG.lights.keyColor, CONFIG.lights.keyIntensity);
    key.position.set(2.6, 4.3, 2.4);
    key.castShadow = true;
    key.shadow.mapSize.width = CONFIG.lights.keyShadowMapSize;
    key.shadow.mapSize.height = CONFIG.lights.keyShadowMapSize;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 16;
    key.shadow.camera.left = -3.6;
    key.shadow.camera.right = 3.6;
    key.shadow.camera.top = 3.6;
    key.shadow.camera.bottom = -2.6;
    key.shadow.bias = -0.00008;
    key.shadow.normalBias = 0.015;
    scene.add(key);

    const fill = new DirectionalLight(CONFIG.lights.fillColor, CONFIG.lights.fillIntensity);
    fill.position.set(-3.2, 1.8, 2.6);
    fill.castShadow = false;
    scene.add(fill);

    const rim = new DirectionalLight(CONFIG.lights.rimColor, CONFIG.lights.rimIntensity);
    rim.position.set(-2.2, 2.6, -3.2);
    rim.castShadow = false;
    scene.add(rim);

    const moving = new PointLight(CONFIG.lights.movingColor, CONFIG.lights.movingMin, 5.6, 2.0);
    moving.position.set(1.2, 1.3, 0.45);
    scene.add(moving);
    movingLightRef.current = moving;

    const glow = new PointLight(0xffe2b5, CONFIG.lights.glowIntensity, 4.6, 2);
    glow.position.set(0.46, 1.48, 0);
    scene.add(glow);
    glowLightRef.current = glow;

    const floorMaterial = new MeshStandardMaterial({
      color: CONFIG.floor.color,
      roughness: 0.98,
      metalness: 0
    });
    floorMaterialRef.current = floorMaterial;
    const floorBase = new Mesh(new PlaneGeometry(6, 6), floorMaterial);
    floorBase.rotation.x = -Math.PI / 2;
    floorBase.position.y = 0;
    floorBase.receiveShadow = true;
    worldRoot.add(floorBase);

    const shadowPlane = new Mesh(new PlaneGeometry(4.6, 4.6), new ShadowMaterial({ opacity: CONFIG.floor.shadowOpacity }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.001;
    shadowPlane.receiveShadow = true;
    worldRoot.add(shadowPlane);

    const petRoot = new Group();
    scene.add(petRoot);
    stageRootRef.current = petRoot;
    applyStageScale(petRoot, stage);
    particlesRef.current = createParticlesSystem(scene, {
      isMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
      getBodyCenter: (target) => {
        const model = modelRootRef.current;
        if (model) {
          model.getWorldPosition(target);
          target.y += 0.26;
        } else {
          target.set(0, 0.8, 0);
        }
        return target;
      },
      getHeadCenter: (target) => {
        const model = modelRootRef.current;
        if (model) {
          model.getWorldPosition(target);
          target.set(target.x + 0.28, target.y + 0.98, target.z + 0.12);
        } else {
          target.set(0.28, 1.2, 0.1);
        }
        return target;
      }
    });

    applyThemeRef.current = (theme) => {
      const material = floorMaterialRef.current;
      if (!material) return;
      if (theme === "theme_spring_room") {
        material.color.setHex(0x8dc58d);
        return;
      }
      if (theme === "theme_crystal_room") {
        material.color.setHex(0x7b8ff0);
        return;
      }
      material.color.setHex(CONFIG.floor.color);
    };

    applyCosmeticsRef.current = (keys) => {
      const model = modelRootRef.current;
      if (!model) return;

      let root = cosmeticsRootRef.current;
      if (!root) {
        root = new Group();
        root.name = "cosmetics-root";
        cosmeticsRootRef.current = root;
        model.add(root);
      }
      очиститьГруппу(root);

      let hornColor = 0xffe2b5;
      if (keys.includes("horn_glow_amber")) hornColor = 0xffcf7a;
      if (keys.includes("horn_glow_aurora")) hornColor = 0xffb8ff;
      if (glowLightRef.current) {
        glowLightRef.current.color.setHex(hornColor);
      }

      if (keys.includes("decor_star_halo")) {
        for (let i = 0; i < 8; i += 1) {
          const angle = (i / 8) * Math.PI * 2;
          const star = new Mesh(
            new SphereGeometry(0.035, 10, 10),
            new MeshStandardMaterial({ color: 0xfff5a9, roughness: 0.35, metalness: 0.2 })
          );
          star.position.set(0.35 + Math.cos(angle) * 0.18, 1.42, Math.sin(angle) * 0.11);
          root.add(star);
        }
      }

      if (keys.includes("decor_moon_tiara")) {
        for (let i = 0; i < 6; i += 1) {
          const step = i / 5;
          const bead = new Mesh(
            new SphereGeometry(0.03, 10, 10),
            new MeshStandardMaterial({ color: 0xffeec8, roughness: 0.4, metalness: 0.18 })
          );
          bead.position.set(0.23 + step * 0.24, 1.33 + Math.sin(step * Math.PI) * 0.06, 0.12);
          root.add(bead);
        }
      }

      if (keys.includes("acc_scarf_sky")) {
        const scarf = new Mesh(
          new SphereGeometry(0.2, 14, 12),
          new MeshStandardMaterial({ color: 0x9dd7ff, roughness: 0.6, metalness: 0.02 })
        );
        scarf.scale.set(1.2, 0.35, 0.95);
        scarf.position.set(0.24, 0.96, 0);
        root.add(scarf);
      }

      if (keys.includes("acc_boots_cloud")) {
        const bootPositions: Array<[number, number, number]> = [
          [-0.2, 0.13, -0.18],
          [-0.2, 0.13, 0.18],
          [0.26, 0.13, -0.18],
          [0.26, 0.13, 0.18]
        ];
        for (const [x, y, z] of bootPositions) {
          const boot = new Mesh(
            new SphereGeometry(0.08, 10, 10),
            new MeshStandardMaterial({ color: 0xf5fbff, roughness: 0.78, metalness: 0.02 })
          );
          boot.scale.set(1.2, 0.75, 1.1);
          boot.position.set(x, y, z);
          root.add(boot);
        }
      }
    };

    applyThemeRef.current(roomTheme);

    let disposed = false;

    const clearMiniGame = () => {
      const runtime = miniGameRef.current;
      if (!runtime || !sceneRef.current) return;

      sceneRef.current.remove(runtime.root);
      for (const target of runtime.targets) {
        target.mesh.geometry.dispose();
        const mat = target.mesh.material;
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose();
        } else {
          mat.dispose();
        }
      }

      miniGameRef.current = null;
      miniGamePromiseRef.current = null;
      setMiniHud((prev) => ({ ...prev, active: false, label: "", score: 0, timeLeft: 0 }));
      actionRunningRef.current = false;
    };

    const finishMiniGame = () => {
      const runtime = miniGameRef.current;
      if (!runtime) return;

      const xp = runtime.score * runtime.config.xpPerHit;
      runtime.resolve({ ageGroup: runtime.ageGroup, score: runtime.score, xp });
      setMiniHud({
        active: false,
        label: runtime.config.label,
        score: runtime.score,
        timeLeft: 0,
        result: `Отлично! +${xp} опыта`
      });
      if (miniGameTimerRef.current !== null) {
        window.clearTimeout(miniGameTimerRef.current);
      }
      miniGameTimerRef.current = window.setTimeout(() => {
        setMiniHud((prev) => ({ ...prev, result: null }));
      }, 1500);
      clearMiniGame();
    };

    const attachModel = (model: Group) => {
      model.traverse((child) => {
        const mesh = child as Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        prepareMeshMaterial(mesh, renderer);
      });

      normalizeToFloorAndHeight(model, CONFIG.model.targetHeight);
      petRoot.add(model);
      modelRootRef.current = model;
      const cosmeticsRoot = new Group();
      cosmeticsRoot.name = "cosmetics-root";
      model.add(cosmeticsRoot);
      cosmeticsRootRef.current = cosmeticsRoot;
      applyStageScale(petRoot, stage);
      snapToGround(model);
      modelBaseYRef.current = model.position.y;
      modelBaseScaleRef.current.copy(model.scale);
      fitCameraToObject(camera, model, CONFIG.camera.fitOffset);
      applyCosmeticsRef.current(activeCosmetics);
      applyThemeRef.current(roomTheme);
      const center = new Vector3();
      model.getWorldPosition(center);
      if (movingLightRef.current) {
        movingLightRef.current.position.set(center.x + 1.1, center.y + 1.2, center.z + 0.4);
      }

      if (!blinkTextureRef.current) {
        blinkTextureRef.current = createBlinkTexture();
      }
      const blinkMaterial = new SpriteMaterial({
        map: blinkTextureRef.current,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false
      });
      const blinkSprite = new Sprite(blinkMaterial);
      blinkSprite.scale.set(0.24, 0.1, 1);
      blinkSprite.position.set(0.3, 1.1, 0.34);
      blinkSprite.renderOrder = 6;
      model.add(blinkSprite);
      blinkMaterialRef.current = blinkMaterial;
    };

    const loadModel = async () => {
      const loader = new GLTFLoader();
      for (const url of FALLBACK_MODEL_URLS) {
        try {
          const gltf = await loader.loadAsync(url);
          if (disposed) return;
          attachModel(gltf.scene);
          return;
        } catch {
          continue;
        }
      }
      if (!disposed) attachModel(buildPrimitiveUnicorn());
    };
    void loadModel();

    const onPointerDown = (event: PointerEvent) => {
      const runtime = miniGameRef.current;
      if (!runtime || !cameraRef.current || !rendererRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);

      const hits = raycasterRef.current.intersectObjects(runtime.targets.map((t) => t.mesh), false);
      if (hits.length === 0) return;
      const hit = hits[0].object as Mesh;
      const target = runtime.targets.find((entry) => entry.mesh === hit);
      if (!target) return;

      runtime.score += 1;
      target.mesh.position.set(randomRange(-1.15, 1.15), randomRange(0.45, 1.8), randomRange(-0.72, 0.72));
      target.velocity.set(randomRange(-1, 1), randomRange(-0.2, 0.2), randomRange(-1, 1)).normalize();
      target.phase = Math.random() * Math.PI * 2;
      target.mesh.scale.setScalar(1.2);
      playTapSoundStub();

      glowPulseRef.current = { startAt: performance.now(), durationMs: 340, peak: CONFIG.actionGlow.maxIntensity };
      particlesRef.current?.burst("mini");
      setMiniHud((prev) => ({ ...prev, score: runtime.score }));
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const resize = () => {
      if (!rendererRef.current || !cameraRef.current || !hostRef.current) return;
      const w = hostRef.current.clientWidth;
      const h = hostRef.current.clientHeight;
      if (w <= 0 || h <= 0) return;
      rendererRef.current.setSize(w, h, false);
      cameraRef.current.aspect = w / h;
      if (modelRootRef.current) {
        fitCameraToObject(cameraRef.current, modelRootRef.current, CONFIG.camera.fitOffset);
      } else {
        cameraRef.current.updateProjectionMatrix();
      }
    };
    resize();

    const onResize = () => {
      if (resizeTimerRef.current !== null) {
        window.clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = window.setTimeout(resize, 80);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);

    const animate = () => {
      if (disposed) return;
      rafRef.current = requestAnimationFrame(animate);

      const model = modelRootRef.current;
      const clock = clockRef.current;
      if (model && clock) {
        const dt = Math.min(0.05, Math.max(0.001, clock.getDelta()));
        const t = clock.elapsedTime;
        const blink = blinkStateRef.current;
        const now = performance.now();

        // Обновление визуальных эффектов
        visualEffects.update(dt);

        const moodState = moodRef.current;
        const moodMotionScale =
          moodState === "happy"
            ? 1.12
            : moodState === "tired"
              ? 0.78
              : moodState === "sick"
                ? 0.72
                : moodState === "sad"
                  ? 0.84
                  : moodState === "hungry"
                    ? 0.9
                    : moodState === "dirty"
                      ? 0.88
                      : 1;

        const idleTarget = actionRunningRef.current ? 0.22 : moodMotionScale;
        idleWeightRef.current = MathUtils.lerp(idleWeightRef.current, idleTarget, clamp(dt * 6, 0, 1));
        const idleFactor = idleWeightRef.current;
        const moodLightScale = moodState === "happy" ? 1.12 : moodState === "tired" || moodState === "sick" ? 0.82 : 1;
        if (hemiLightRef.current) {
          hemiLightRef.current.intensity = (0.55 + Math.sin(t * 0.3) * 0.05) * moodLightScale;
        }
        if (movingLightRef.current) {
          const center = new Vector3();
          model.getWorldPosition(center);
          const orbit = t * 0.45;
          movingLightRef.current.position.set(
            center.x + Math.cos(orbit) * 1.25,
            center.y + 1.15 + Math.sin(t * 0.9) * 0.1,
            center.z + Math.sin(orbit) * 0.9
          );
          const pulse = (Math.sin(t * 1.2) + 1) * 0.5;
          movingLightRef.current.intensity = MathUtils.lerp(CONFIG.lights.movingMin, CONFIG.lights.movingMax, pulse) * moodLightScale;
        }
        const look = lookStateRef.current;
        const lookYawRange = moodState === "happy" ? 0.18 : moodState === "tired" || moodState === "sick" ? 0.1 : 0.15;
        const lookPitchRange = moodState === "happy" ? 0.07 : moodState === "tired" || moodState === "sick" ? 0.04 : 0.06;
        const lookRetargetMin = moodState === "happy" ? 2100 : moodState === "tired" || moodState === "sick" ? 3400 : 2500;
        const lookRetargetMax = moodState === "happy" ? 4200 : moodState === "tired" || moodState === "sick" ? 6200 : 5000;
        if (now >= look.nextAt && !actionRunningRef.current) {
          look.targetYaw = randomRange(-lookYawRange, lookYawRange);
          look.targetPitch = randomRange(-lookPitchRange, lookPitchRange);
          look.nextAt = now + randomRange(lookRetargetMin, lookRetargetMax);
        }
        look.yaw = MathUtils.lerp(look.yaw, look.targetYaw, clamp(dt * 2.3, 0, 1));
        look.pitch = MathUtils.lerp(look.pitch, look.targetPitch, clamp(dt * 2.1, 0, 1));
        const jump = jumpStateRef.current;
        const moodAllowsJump = moodState !== "sick" && moodState !== "tired";
        const jumpMin = moodState === "happy" ? 7600 : moodState === "sad" ? 11000 : 10000;
        const jumpMax = moodState === "happy" ? 11800 : moodState === "sad" ? 17000 : 15000;
        if (!jump.active && now >= jump.nextAt && !actionRunningRef.current && !miniGameRef.current && moodAllowsJump) {
          jump.active = true;
          jump.startAt = now;
          jump.durationMs = randomRange(690, 820);
          jump.nextAt = now + randomRange(jumpMin, jumpMax);
        }
        let joyJump = 0;
        if (jump.active) {
          const pJump = clamp((now - jump.startAt) / jump.durationMs, 0, 1);
          const moodJumpScale = moodState === "happy" ? 1.2 : moodState === "sad" ? 0.75 : 1;
          joyJump = Math.sin(pJump * Math.PI) * 0.09 * moodJumpScale;
          if (pJump >= 1) {
            jump.active = false;
          }
        }

        const moodBlinkMin = moodState === "happy" ? 2200 : moodState === "sick" ? 1700 : moodState === "tired" ? 1900 : 2500;
        const moodBlinkMax = moodState === "happy" ? 4700 : moodState === "sick" ? 3200 : moodState === "tired" ? 3600 : 5500;
        if (!blink.active && now >= blink.nextAt) {
          blink.active = true;
          blink.startedAt = now;
          blink.durationMs = randomRange(80, 120);
          blink.doublePending = Math.random() < 0.2;
        }
        if (blink.active) {
          const p = clamp((now - blink.startedAt) / blink.durationMs, 0, 1);
          const close = p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5;
          blink.amount = Math.max(0, close);
          const moodBlinkOpacity = moodState === "sick" || moodState === "tired" ? 0.85 : 0.7;
          if (blinkMaterialRef.current) blinkMaterialRef.current.opacity = blink.amount * moodBlinkOpacity;
          if (p >= 1) {
            blink.active = false;
            blink.amount = 0;
            if (blinkMaterialRef.current) blinkMaterialRef.current.opacity = 0;
            const boost = now < chatBlinkBoostUntilRef.current;
            if (blink.doublePending) {
              blink.doublePending = false;
              blink.nextAt = now + randomRange(90, 140);
            } else {
              blink.nextAt = now + (boost ? randomRange(1200, 2200) : randomRange(moodBlinkMin, moodBlinkMax));
            }
          }
        }

        const moodYOffset = moodState === "tired" ? -0.012 : moodState === "sick" ? -0.016 : moodState === "sad" ? -0.007 : 0;
        const moodBobScale = moodState === "happy" ? 1.15 : moodState === "tired" || moodState === "sick" ? 0.72 : moodState === "sad" ? 0.85 : 1;
        model.position.y = modelBaseYRef.current + Math.sin(t * 1.45) * 0.009 * idleFactor * moodBobScale + joyJump + moodYOffset;
        model.rotation.x = Math.sin(t * 1.15) * 0.012 * idleFactor * moodBobScale + look.pitch * 0.32;
        model.rotation.y = Math.sin(t * 0.62) * 0.055 * idleFactor * moodBobScale + look.yaw;
        model.rotation.z = Math.sin(t * 1.9) * 0.01 * idleFactor * moodBobScale;
        const baseScale = modelBaseScaleRef.current;
        const breathFrequency = moodState === "tired" || moodState === "sick" ? 1.7 : 2.2;
        const breathMoodScale = moodState === "happy" ? 1.1 : moodState === "sick" ? 0.7 : 1;
        const breathWave = Math.sin(t * breathFrequency) * 0.014 * idleFactor * breathMoodScale;
        model.scale.set(
          baseScale.x * (1 + breathWave),
          baseScale.y,
          baseScale.z * (1 - breathWave * 0.4)
        );

        particlesRef.current?.update(dt, t);

        const mini = miniGameRef.current;
        if (mini) {
          const secondsLeft = Math.max(0, (mini.endAt - now) / 1000);
          for (const target of mini.targets) {
            target.mesh.position.addScaledVector(target.velocity, dt * mini.config.speed);
            target.mesh.position.y += Math.sin(t * 2.4 + target.phase) * dt * 0.26;
            target.mesh.rotation.y += dt * 2.4;
            if (target.mesh.position.x < -1.2 || target.mesh.position.x > 1.2) target.velocity.x *= -1;
            if (target.mesh.position.y < 0.4 || target.mesh.position.y > 1.9) target.velocity.y *= -1;
            if (target.mesh.position.z < -0.82 || target.mesh.position.z > 0.82) target.velocity.z *= -1;
            target.mesh.scale.lerp(new Vector3(1, 1, 1), clamp(dt * 6, 0, 1));
          }
          setMiniHud((prev) => ({ ...prev, score: mini.score, timeLeft: Math.ceil(secondsLeft) }));
          if (secondsLeft <= 0) finishMiniGame();
        }
      }

      if (glowLightRef.current) {
        const pulse = glowPulseRef.current;
        if (pulse) {
          const elapsed = performance.now() - pulse.startAt;
          const t = Math.min(1, elapsed / pulse.durationMs);
          const fade = (1 - t) ** 2;
          glowLightRef.current.intensity = pulse.peak * fade;
          if (t >= 1) {
            glowPulseRef.current = null;
            glowLightRef.current.intensity = CONFIG.lights.glowIntensity;
          }
        } else {
          glowLightRef.current.intensity = CONFIG.lights.glowIntensity;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      visualEffects.stop();
      visualEffects.dispose();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      if (resizeTimerRef.current !== null) {
        window.clearTimeout(resizeTimerRef.current);
      }
      if (miniGameTimerRef.current !== null) {
        window.clearTimeout(miniGameTimerRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (scene.background && "dispose" in scene.background) {
        scene.background.dispose();
      }
      if (cosmeticsRootRef.current) {
        очиститьГруппу(cosmeticsRootRef.current);
      }
      particlesRef.current?.dispose();
      if (blinkMaterialRef.current) blinkMaterialRef.current.dispose();
      if (blinkTextureRef.current) blinkTextureRef.current.dispose();
      renderer.dispose();
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  const queueTask = (task: () => Promise<void>): Promise<void> => {
    queueRef.current = queueRef.current.then(task).catch(() => undefined);
    return queueRef.current;
  };

  const playProcedural = async (actionName: ТипДействия): Promise<void> => {
    const model = modelRootRef.current;
    if (!model || miniGameRef.current) {
      await wait(900);
      return;
    }

    actionRunningRef.current = true;
    const duration = ACTION_CONFIG[actionName]?.durationMs || 800;
    
    // Получаем позицию модели для эффектов
    const effectPosition = new Vector3();
    model.getWorldPosition(effectPosition);
    effectPosition.y += 0.6; // Центр тела
    
    // Триггер визуальных эффектов
    visualEffects.triggerActionEffect(actionName, effectPosition);
    
    // Настройки свечения для каждого действия
    const glowSettings: Record<ТипДействия, { duration: number; peak: number }> = {
      feed: { duration: 360, peak: 0.45 },
      wash: { duration: 450, peak: 0.48 },
      play: { duration: 520, peak: 0.50 },
      heal: { duration: 600, peak: CONFIG.actionGlow.maxIntensity },
      chat: { duration: 300, peak: 0.40 },
      sleep: { duration: 500, peak: 0.35 },
      clean: { duration: 400, peak: 0.42 }
    };
    
    const glow = glowSettings[actionName] || { duration: 300, peak: 0.40 };
    glowPulseRef.current = { 
      startAt: performance.now(), 
      durationMs: glow.duration, 
      peak: glow.peak 
    };
    
    // Эффекты частиц
    if (actionName === "feed" || actionName === "play" || actionName === "heal") {
      particlesRef.current?.burst(actionName);
    }
    
    // Специальные эффекты
    if (actionName === "chat") {
      chatBlinkBoostUntilRef.current = performance.now() + 2600;
    }
    
    const start = performance.now();
    const startY = model.position.y;
    const startRotX = model.rotation.x;
    const startRotY = model.rotation.y;
    const startRotZ = model.rotation.z;
    const startScale = model.scale.clone();

    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        const e = MathUtils.smoothstep(t, 0, 1);
        // Мягкие анимации без резких и неестественных рывков
        switch (actionName) {
          case "feed":
            // Небольшое дружелюбное кивание
            model.rotation.x = startRotX + Math.sin(e * Math.PI * 2.5) * 0.08;
            model.position.y = startY + Math.sin(e * Math.PI * 2.5) * 0.025;
            break;
          case "wash":
            // Лёгкое покачивание корпуса
            model.rotation.z = startRotZ + Math.sin(e * Math.PI * 3.5) * 0.07;
            model.rotation.y = startRotY + Math.sin(e * Math.PI * 2) * 0.05;
            break;

          case "play": {
            // Упругий подпрыг без полного вращения
            const hop = Math.sin(e * Math.PI * 2) * 0.16;
            model.position.y = startY + Math.max(0, hop);
            model.rotation.y = startRotY + Math.sin(e * Math.PI * 2) * 0.28;
            const squash = Math.sin(e * Math.PI * 2) * 0.015;
            model.scale.set(
              startScale.x * (1 + squash),
              startScale.y * (1 - squash * 0.7),
              startScale.z * (1 + squash)
            );
            break;
          }
          case "heal":
            // Спокойное приподнимание
            model.position.y = startY + Math.sin(e * Math.PI) * 0.09;
            model.rotation.x = startRotX + Math.sin(e * Math.PI) * 0.03;
            model.scale.set(
              startScale.x * (1 + Math.sin(e * Math.PI) * 0.012),
              startScale.y,
              startScale.z * (1 + Math.sin(e * Math.PI) * 0.012)
            );
            break;
          case "chat":
            // Короткие живые повороты головы
            model.rotation.y = startRotY + Math.sin(e * Math.PI * 4) * 0.08;
            model.rotation.x = startRotX + Math.sin(e * Math.PI * 3) * 0.03;
            break;
          case "sleep":
            // Мягкое засыпание
            model.position.y = startY - e * 0.08;
            model.rotation.z = startRotZ + e * 0.14;
            model.scale.set(
              startScale.x * (1 - e * 0.015),
              startScale.y * (1 - e * 0.02),
              startScale.z * (1 - e * 0.015)
            );
            break;
          case "clean":
            // Аккуратные быстрые движения
            model.rotation.y = startRotY + Math.sin(e * Math.PI * 5) * 0.09;
            model.position.y = startY + Math.sin(e * Math.PI * 3.2) * 0.05;
            break;
          default:
            model.rotation.y = startRotY + Math.sin(e * Math.PI * 2.5) * 0.05;
        }
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      tick();
    });

    const settleStart = performance.now();
    const settleDuration = 160;
    const fromY = model.position.y;
    const fromRotX = model.rotation.x;
    const fromRotY = model.rotation.y;
    const fromRotZ = model.rotation.z;
    const fromScale = model.scale.clone();
    await new Promise<void>((resolve) => {
      const settleTick = () => {
        const p = Math.min(1, (performance.now() - settleStart) / settleDuration);
        const s = MathUtils.smootherstep(p, 0, 1);
        model.position.y = MathUtils.lerp(fromY, startY, s);
        model.rotation.x = MathUtils.lerp(fromRotX, startRotX, s);
        model.rotation.y = MathUtils.lerp(fromRotY, startRotY, s);
        model.rotation.z = MathUtils.lerp(fromRotZ, startRotZ, s);
        model.scale.set(
          MathUtils.lerp(fromScale.x, startScale.x, s),
          MathUtils.lerp(fromScale.y, startScale.y, s),
          MathUtils.lerp(fromScale.z, startScale.z, s)
        );

        if (p < 1) {
          requestAnimationFrame(settleTick);
        } else {
          resolve();
        }
      };
      settleTick();
    });

    actionRunningRef.current = false;
  };

  const playAction = (actionName: ТипДействия): Promise<void> => queueTask(() => playProcedural(actionName));

  const startMiniGame = (ageGroup: ВозрастМиниИгры): Promise<РезультатМиниИгры3D> => {
    if (miniGamePromiseRef.current) {
      return miniGamePromiseRef.current;
    }
    const scene = sceneRef.current;
    if (!scene) {
      return Promise.resolve({ ageGroup, score: 0, xp: 0 });
    }

    const config = MINI_GAME_CONFIG[ageGroup];
    const promise = new Promise<РезультатМиниИгры3D>((resolve) => {
      const root = new Group();
      root.name = "miniTargets";
      scene.add(root);

      const targets: MiniGameTarget[] = [];
      for (let i = 0; i < config.targets; i += 1) {
        const mesh = new Mesh(
          new SphereGeometry(config.radius, 14, 14),
          new MeshBasicMaterial({
            color: i % 3 === 0 ? 0xffd7ff : i % 3 === 1 ? 0xc5f4ff : 0xfff2b3,
            transparent: true,
            opacity: 0.95
          })
        );
        mesh.position.set(randomRange(-1.12, 1.12), randomRange(0.48, 1.8), randomRange(-0.72, 0.72));
        root.add(mesh);
        targets.push({
          mesh,
          velocity: new Vector3(randomRange(-1, 1), randomRange(-0.2, 0.2), randomRange(-1, 1)).normalize(),
          phase: randomRange(0, Math.PI * 2)
        });
      }

      miniGameRef.current = {
        ageGroup,
        config,
        root,
        targets,
        score: 0,
        endAt: performance.now() + 20000,
        resolve
      };
      actionRunningRef.current = true;
      particlesRef.current?.burst("play");
      setMiniHud({
        active: true,
        label: config.label,
        score: 0,
        timeLeft: 20,
        result: null
      });
    });

    miniGamePromiseRef.current = promise.then((value) => {
      miniGamePromiseRef.current = null;
      return value;
    });
    return miniGamePromiseRef.current;
  };

  const evolveTo = (nextStage: СтадияПитомца): Promise<void> =>
    queueTask(async () => {
      const stageRoot = stageRootRef.current;
      const model = modelRootRef.current;
      const camera = cameraRef.current;
      if (!stageRoot || !model || !camera) return;
      actionRunningRef.current = true;
      setEvolveOverlay({ visible: true, title: `Эволюция! ${stageTitle(nextStage)}` });
      particlesRef.current?.setSpiralBoost(true);
      particlesRef.current?.burst("evolve");

      const glow = glowLightRef.current;
      const start = performance.now();
      const startPos = camera.position.clone();
      const startFov = camera.fov;
      const box = new Box3().setFromObject(model);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      const zoomTarget = new Vector3(center.x, center.y + size.y * 0.08, center.z + Math.max(1.8, size.z * 2.4));
      let stageApplied = false;

      await new Promise<void>((resolve) => {
        const run = () => {
          const t = Math.min(1, (performance.now() - start) / 1500);
          const pulse = Math.sin(t * Math.PI);
          const eased = MathUtils.smoothstep(t, 0, 1);
          if (glow) {
            glow.intensity = CONFIG.actionGlow.maxIntensity * pulse;
          }
          camera.position.lerpVectors(startPos, zoomTarget, eased);
          camera.fov = MathUtils.lerp(startFov, startFov * 0.88, eased);
          camera.lookAt(center);
          camera.updateProjectionMatrix();
          stageRoot.rotation.y = pulse * 0.34;
          if (!stageApplied && t >= 0.55) {
            applyStageScale(stageRoot, nextStage);
            snapToGround(model);
            modelBaseYRef.current = model.position.y;
            stageApplied = true;
          }
          if (t < 1) {
            requestAnimationFrame(run);
          } else {
            resolve();
          }
        };
        run();
      });

      stageRoot.rotation.y = 0;
      camera.fov = startFov;
      fitCameraToObject(camera, model, CONFIG.camera.fitOffset);

      if (glow) {
        glow.intensity = CONFIG.lights.glowIntensity;
      }
      particlesRef.current?.setSpiralBoost(false);
      await wait(220);
      setEvolveOverlay({ visible: false, title: "" });
      actionRunningRef.current = false;
    });

  useImperativeHandle(
    ref,
    () => ({
      playAction,
      evolveTo,
      startMiniGame
    }),
    []
  );

  return (
    <div ref={hostRef} className={className ?? "unicorn-3d"}>
      {miniHud.active && (
        <div className="dragon-hud">
          <div className="dragon-hud-chip">Поймай магию • {miniHud.label}</div>
          <div className="dragon-hud-row">
            <span>Очки: {miniHud.score}</span>
            <span>Время: {miniHud.timeLeft}с</span>
          </div>
        </div>
      )}
      {miniHud.result && <div className="dragon-hud-result">{miniHud.result}</div>}
      {evolveOverlay.visible && (
        <div className="dragon-cinematic-overlay">
          <div className="dragon-cinematic-vignette" />
          <div className="dragon-cinematic-card">
            <strong>{evolveOverlay.title}</strong>
            <span>Дракончик Искра становится сильнее</span>
          </div>
        </div>
      )}
    </div>
  );
});

export type Unicorn3DHandle = Dragon3DHandle;
export const Unicorn3D = Dragon3D;
