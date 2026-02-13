import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  Clock,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  SphereGeometry,
  Vector3,
  WebGLRenderer
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { СтадияПитомца, ТипДействия } from "../types";

type ActionConfig = { durationMs: number };

const ACTION_CONFIG: Record<ТипДействия, ActionConfig> = {
  feed: { durationMs: 900 },
  wash: { durationMs: 1000 },
  play: { durationMs: 1200 },
  heal: { durationMs: 1100 },
  chat: { durationMs: 850 }
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
    rimIntensity: 0.3,
    rimColor: 0xffb3e6,
    glowIntensity: 0.0,
    keyShadowMapSize: 2048
  },
  floor: {
    color: 0x6c77a6,
    shadowOpacity: 0.3
  },
  actionGlow: {
    maxIntensity: 0.6
  }
} as const;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.max(minValue, Math.min(maxValue, value));
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
  gradient.addColorStop(0, "#8FD3FF");
  gradient.addColorStop(0.5, "#B9A8FF");
  gradient.addColorStop(1, "#7C86FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function buildPrimitiveUnicorn(): Group {
  const root = new Group();

  const bodyMat = new MeshStandardMaterial({ color: 0xffb8f8, roughness: 0.38, metalness: 0.08 });
  const maneMat = new MeshStandardMaterial({ color: 0x38c9ff, roughness: 0.3, metalness: 0.12 });
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

    const colorized = material as MeshStandardMaterial & { color?: Color };
    if (colorized.color && colorized.color.isColor) {
      const hsl = { h: 0, s: 0, l: 0 };
      colorized.color.getHSL(hsl);
      colorized.color.setHSL(hsl.h, clamp(hsl.s * 1.08, 0, 1), clamp(hsl.l * 1.04, 0, 1));
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

export interface Unicorn3DHandle {
  playAction: (actionName: ТипДействия) => Promise<void>;
  evolveTo: (stage: СтадияПитомца) => Promise<void>;
}

type Props = {
  stage: СтадияПитомца;
  className?: string;
};

export const Unicorn3D = forwardRef<Unicorn3DHandle, Props>(function Unicorn3D({ stage, className }, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const clockRef = useRef<Clock | null>(null);
  const stageRootRef = useRef<Group | null>(null);
  const modelRootRef = useRef<Group | null>(null);
  const modelBaseYRef = useRef<number>(0);
  const glowLightRef = useRef<PointLight | null>(null);
  const glowPulseRef = useRef<{ startAt: number; durationMs: number; peak: number } | null>(null);
  const actionRunningRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const rafRef = useRef<number>(0);
  const resizeTimerRef = useRef<number | null>(null);

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
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new Scene();
    scene.background = createGradientBackgroundTexture();
    const worldRoot = new Group();
    scene.add(worldRoot);

    const camera = new PerspectiveCamera(34, 1, CONFIG.camera.minNear, CONFIG.camera.minFar);
    camera.position.set(0, 1.0, CONFIG.camera.defaultZ);
    camera.lookAt(0, 0.6, 0);
    cameraRef.current = camera;
    clockRef.current = new Clock();

    const hemi = new HemisphereLight(0xbddcff, 0x5f6a95, CONFIG.lights.hemiIntensity);
    scene.add(hemi);

    const key = new DirectionalLight(CONFIG.lights.keyColor, CONFIG.lights.keyIntensity);
    key.position.set(2.6, 4.4, 2.2);
    key.castShadow = true;
    key.shadow.mapSize.width = CONFIG.lights.keyShadowMapSize;
    key.shadow.mapSize.height = CONFIG.lights.keyShadowMapSize;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.camera.left = -3.5;
    key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 3.5;
    key.shadow.camera.bottom = -2.5;
    key.shadow.bias = -0.00012;
    scene.add(key);

    const rim = new DirectionalLight(CONFIG.lights.rimColor, CONFIG.lights.rimIntensity);
    rim.position.set(-2.2, 2.6, -3.2);
    rim.castShadow = false;
    scene.add(rim);

    const fill = new DirectionalLight(CONFIG.lights.fillColor, CONFIG.lights.fillIntensity);
    fill.position.set(-3.2, 1.8, 2.4);
    fill.castShadow = false;
    scene.add(fill);

    const glow = new PointLight(0xffe2b5, CONFIG.lights.glowIntensity, 4.6, 2);
    glow.position.set(0.46, 1.48, 0);
    scene.add(glow);
    glowLightRef.current = glow;

    const floorBase = new Mesh(
      new PlaneGeometry(6, 6),
      new MeshStandardMaterial({
        color: CONFIG.floor.color,
        roughness: 0.95,
        metalness: 0.02
      })
    );
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

    let disposed = false;

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
      applyStageScale(petRoot, stage);
      snapToGround(model);
      modelBaseYRef.current = model.position.y;
      fitCameraToObject(camera, model, CONFIG.camera.fitOffset);
    };

    const loadModel = async () => {
      try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync("/assets/models/unicorn.glb");
        if (disposed) return;
        attachModel(gltf.scene);
      } catch {
        if (disposed) return;
        attachModel(buildPrimitiveUnicorn());
      }
    };
    void loadModel();

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
      resizeTimerRef.current = window.setTimeout(resize, 120);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);

    const animate = () => {
      if (disposed) return;
      rafRef.current = requestAnimationFrame(animate);

      const model = modelRootRef.current;
      const clock = clockRef.current;
      if (model && clock && !actionRunningRef.current) {
        const t = clock.elapsedTime;
        model.position.y = modelBaseYRef.current + Math.sin(t * 1.45) * 0.01;
        model.rotation.y = Math.sin(t * 0.62) * 0.085;
        model.rotation.z = Math.sin(t * 1.9) * 0.012;
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
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      if (resizeTimerRef.current !== null) {
        window.clearTimeout(resizeTimerRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (scene.background && "dispose" in scene.background) {
        scene.background.dispose();
      }
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
    if (!model) {
      await wait(900);
      return;
    }

    actionRunningRef.current = true;
    const duration = ACTION_CONFIG[actionName].durationMs;
    const glowDuration =
      actionName === "heal" ? 600 : actionName === "play" ? 520 : actionName === "wash" ? 450 : actionName === "feed" ? 360 : 300;
    const glowPeak = actionName === "heal" ? CONFIG.actionGlow.maxIntensity : Math.min(0.48, CONFIG.actionGlow.maxIntensity);
    glowPulseRef.current = { startAt: performance.now(), durationMs: glowDuration, peak: glowPeak };
    const start = performance.now();
    const startY = model.position.y;
    const startRotX = model.rotation.x;
    const startRotY = model.rotation.y;
    const startRotZ = model.rotation.z;

    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        const e = MathUtils.smoothstep(t, 0, 1);
        if (actionName === "play") {
          model.position.y = startY + Math.sin(e * Math.PI) * 0.32;
          model.rotation.y = startRotY + Math.sin(e * Math.PI * 2) * 0.42;
        } else if (actionName === "feed") {
          model.rotation.x = startRotX + Math.sin(e * Math.PI * 2) * 0.1;
        } else if (actionName === "wash") {
          model.rotation.z = startRotZ + Math.sin(e * Math.PI * 2.8) * 0.1;
        } else if (actionName === "heal") {
          model.position.y = startY + Math.sin(e * Math.PI) * 0.16;
        } else {
          model.rotation.y = startRotY + Math.sin(e * Math.PI * 3) * 0.13;
        }
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          model.position.y = startY;
          model.rotation.x = startRotX;
          model.rotation.y = startRotY;
          model.rotation.z = startRotZ;
          resolve();
        }
      };
      tick();
    });

    actionRunningRef.current = false;
  };

  const playAction = (actionName: ТипДействия): Promise<void> => queueTask(() => playProcedural(actionName));

  const evolveTo = (nextStage: СтадияПитомца): Promise<void> =>
    queueTask(async () => {
      const stageRoot = stageRootRef.current;
      if (!stageRoot) return;
      actionRunningRef.current = true;

      const glow = glowLightRef.current;
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const run = () => {
          const t = Math.min(1, (performance.now() - start) / 620);
          const pulse = Math.sin(t * Math.PI);
          if (glow) {
            glow.intensity = 1.45 * pulse;
          }
          stageRoot.rotation.y += 0.02;
          if (t < 1) {
            requestAnimationFrame(run);
          } else {
            resolve();
          }
        };
        run();
      });

      applyStageScale(stageRoot, nextStage);
      const model = modelRootRef.current;
      if (model) {
        snapToGround(model);
        modelBaseYRef.current = model.position.y;
      }
      stageRoot.rotation.y = 0;
      const camera = cameraRef.current;
      if (camera && model) {
        fitCameraToObject(camera, model, CONFIG.camera.fitOffset);
      }

      if (glow) {
        glow.intensity = 1.6;
      }
      await wait(220);
      actionRunningRef.current = false;
    });

  useImperativeHandle(
    ref,
    () => ({
      playAction,
      evolveTo
    }),
    []
  );

  return <div ref={hostRef} className={className ?? "unicorn-3d"} />;
});
