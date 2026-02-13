import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  Points,
  PointsMaterial,
  Scene,
  Vector3
} from "three";

export type ParticleBurstType = "feed" | "wash" | "play" | "heal" | "chat" | "evolve" | "mini";

export interface ParticleSystem {
  update: (dt: number, elapsed: number) => void;
  burst: (type?: ParticleBurstType) => void;
  setSpiralBoost: (active: boolean) => void;
  dispose: () => void;
}

type LayerKind = "ambient" | "head";

type ParticleLayer = {
  kind: LayerKind;
  count: number;
  points: Points;
  geometry: BufferGeometry;
  material: PointsMaterial;
  positions: Float32Array;
  colors: Float32Array;
  angles: Float32Array;
  radii: Float32Array;
  heights: Float32Array;
  verticalSpeeds: Float32Array;
  colorSeeds: Float32Array;
  sizeBase: number;
  sizeAmp: number;
};

type BurstState = {
  points: Points;
  geometry: BufferGeometry;
  material: PointsMaterial;
  positions: Float32Array;
  colors: Float32Array;
  velocities: Float32Array;
  lifes: Float32Array;
  activeCount: number;
  maxCount: number;
};

type SystemOptions = {
  isMobile: boolean;
  getBodyCenter: (target: Vector3) => Vector3;
  getHeadCenter: (target: Vector3) => Vector3;
};

const PASTEL_HEX = ["#ffffff", "#ffd1ff", "#bde7ff", "#fff2b3"];
const PASTEL_HSL: Array<{ h: number; s: number; l: number }> = PASTEL_HEX.map((hex) => {
  const color = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  return hsl;
});

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createSoftTexture(size = 64): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось создать canvas для частиц");

  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2 - 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createLayer(kind: LayerKind, count: number, texture: CanvasTexture): ParticleLayer {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  const heights = new Float32Array(count);
  const verticalSpeeds = new Float32Array(count);
  const colorSeeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const palette = PASTEL_HSL[i % PASTEL_HSL.length];
    const c = new Color().setHSL(palette.h, palette.s, palette.l);
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    angles[i] = randomRange(0, Math.PI * 2);
    radii[i] = kind === "ambient" ? randomRange(0.35, 0.95) : randomRange(0.1, 0.36);
    heights[i] = kind === "ambient" ? randomRange(0.02, 1.8) : randomRange(0.04, 0.62);
    verticalSpeeds[i] = kind === "ambient" ? randomRange(0.12, 0.35) : randomRange(0.08, 0.2);
    colorSeeds[i] = randomRange(0, Math.PI * 2);
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute("color", new BufferAttribute(colors, 3).setUsage(DynamicDrawUsage));

  const material = new PointsMaterial({
    map: texture,
    size: kind === "ambient" ? 0.1 : 0.065,
    transparent: true,
    opacity: kind === "ambient" ? 0.78 : 0.72,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    vertexColors: true,
    sizeAttenuation: true
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = kind === "ambient" ? 2 : 3;

  return {
    kind,
    count,
    points,
    geometry,
    material,
    positions,
    colors,
    angles,
    radii,
    heights,
    verticalSpeeds,
    colorSeeds,
    sizeBase: kind === "ambient" ? 0.1 : 0.065,
    sizeAmp: kind === "ambient" ? 0.022 : 0.018
  };
}

function createBurst(maxCount: number, texture: CanvasTexture): BurstState {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(maxCount * 3);
  const colors = new Float32Array(maxCount * 3);
  const velocities = new Float32Array(maxCount * 3);
  const lifes = new Float32Array(maxCount);
  geometry.setAttribute("position", new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute("color", new BufferAttribute(colors, 3).setUsage(DynamicDrawUsage));

  const material = new PointsMaterial({
    map: texture,
    size: 0.13,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
    sizeAttenuation: true
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  points.renderOrder = 4;

  return {
    points,
    geometry,
    material,
    positions,
    colors,
    velocities,
    lifes,
    activeCount: 0,
    maxCount
  };
}

export function createParticlesSystem(scene: Scene, options: SystemOptions): ParticleSystem {
  const texture = createSoftTexture();

  const ambientCount = options.isMobile ? 96 : 120;
  const headCount = options.isMobile ? 34 : 48;
  const burstMaxCount = options.isMobile ? Math.max(24, 180 - ambientCount - headCount) : 200;

  const ambientLayer = createLayer("ambient", ambientCount, texture);
  const headLayer = createLayer("head", headCount, texture);
  const burst = createBurst(burstMaxCount, texture);
  scene.add(ambientLayer.points);
  scene.add(headLayer.points);
  scene.add(burst.points);

  const tempBody = new Vector3();
  const tempHead = new Vector3();
  const tempColor = new Color();
  let spiralBoost = 0;

  const updateLayer = (layer: ParticleLayer, center: Vector3, dt: number, elapsed: number) => {
    const isHead = layer.kind === "head";
    const baseOpacity = isHead ? 0.72 : 0.76;
    const opacityWave = isHead ? 0.15 : 0.12;

    layer.material.size = layer.sizeBase + Math.sin(elapsed * (isHead ? 1.8 : 1.2)) * layer.sizeAmp;
    layer.material.opacity = Math.max(0.6, Math.min(0.9, baseOpacity + Math.sin(elapsed * (isHead ? 2.2 : 1.5)) * opacityWave));

    const radialFactor = 1 + spiralBoost * 0.4;

    for (let i = 0; i < layer.count; i += 1) {
      layer.angles[i] += dt * (isHead ? 1.6 : 0.9);
      layer.heights[i] += dt * layer.verticalSpeeds[i] * (1 + spiralBoost * 0.3);

      const maxHeight = isHead ? 0.72 : 1.95;
      if (layer.heights[i] > maxHeight) {
        layer.heights[i] = isHead ? randomRange(0.02, 0.12) : randomRange(0.03, 0.24);
      }

      const r = layer.radii[i] * radialFactor + Math.sin(elapsed * 1.6 + i * 0.2) * (isHead ? 0.03 : 0.05);
      const jitter = Math.sin(elapsed * 3 + i * 0.37) * (isHead ? 0.02 : 0.035);

      layer.positions[i * 3 + 0] = center.x + Math.cos(layer.angles[i]) * r + jitter;
      layer.positions[i * 3 + 1] = center.y + layer.heights[i] + Math.cos(elapsed * 2 + i * 0.51) * (isHead ? 0.015 : 0.03);
      layer.positions[i * 3 + 2] = center.z + Math.sin(layer.angles[i]) * r + Math.sin(elapsed * 2.6 + i * 0.41) * (isHead ? 0.02 : 0.03);

      const palette = PASTEL_HSL[i % PASTEL_HSL.length];
      const hueShift = Math.sin(elapsed * (isHead ? 0.95 : 0.65) + layer.colorSeeds[i]) * 0.03;
      tempColor.setHSL((palette.h + hueShift + 1) % 1, palette.s, palette.l);
      layer.colors[i * 3 + 0] = tempColor.r;
      layer.colors[i * 3 + 1] = tempColor.g;
      layer.colors[i * 3 + 2] = tempColor.b;
    }

    (layer.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
    (layer.geometry.getAttribute("color") as BufferAttribute).needsUpdate = true;
  };

  const updateBurst = (dt: number, elapsed: number) => {
    if (burst.activeCount <= 0) {
      burst.points.visible = false;
      burst.material.opacity = 0;
      return;
    }

    burst.points.visible = true;
    let alive = 0;
    let maxLife = 0;

    for (let i = 0; i < burst.activeCount; i += 1) {
      const life = burst.lifes[i];
      if (life <= 0) continue;

      const nextLife = Math.max(0, life - dt * 1.9);
      burst.lifes[i] = nextLife;
      if (nextLife <= 0) continue;

      const vx = burst.velocities[i * 3 + 0];
      const vy = burst.velocities[i * 3 + 1];
      const vz = burst.velocities[i * 3 + 2];

      burst.positions[i * 3 + 0] += vx * dt;
      burst.positions[i * 3 + 1] += vy * dt;
      burst.positions[i * 3 + 2] += vz * dt;

      burst.velocities[i * 3 + 0] *= 0.94;
      burst.velocities[i * 3 + 1] = burst.velocities[i * 3 + 1] * 0.94 + Math.sin(elapsed * 5 + i) * 0.002;
      burst.velocities[i * 3 + 2] *= 0.94;

      const palette = PASTEL_HSL[i % PASTEL_HSL.length];
      const lightness = Math.max(0.5, palette.l * nextLife);
      tempColor.setHSL(palette.h, palette.s, lightness);
      burst.colors[i * 3 + 0] = tempColor.r;
      burst.colors[i * 3 + 1] = tempColor.g;
      burst.colors[i * 3 + 2] = tempColor.b;

      alive += 1;
      maxLife = Math.max(maxLife, nextLife);
    }

    burst.material.opacity = Math.max(0, Math.min(0.9, maxLife));
    (burst.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
    (burst.geometry.getAttribute("color") as BufferAttribute).needsUpdate = true;

    if (alive === 0) {
      burst.activeCount = 0;
      burst.points.visible = false;
      burst.material.opacity = 0;
    }
  };

  const burstEmit = (type: ParticleBurstType = "play") => {
    const origin = options.getBodyCenter(tempBody);
    const burstCount = type === "evolve" || type === "heal" ? burst.maxCount : Math.min(120, burst.maxCount);
    burst.activeCount = burstCount;
    burst.points.visible = true;
    burst.material.opacity = 0.9;

    for (let i = 0; i < burstCount; i += 1) {
      const angleA = randomRange(0, Math.PI * 2);
      const angleB = randomRange(-0.25, 0.9);
      const speed = type === "evolve" ? randomRange(1.5, 2.8) : randomRange(1.1, 2.1);

      const dx = Math.cos(angleA) * Math.cos(angleB);
      const dy = Math.sin(angleB) + 0.2;
      const dz = Math.sin(angleA) * Math.cos(angleB);

      burst.positions[i * 3 + 0] = origin.x;
      burst.positions[i * 3 + 1] = origin.y + 0.45;
      burst.positions[i * 3 + 2] = origin.z;

      burst.velocities[i * 3 + 0] = dx * speed;
      burst.velocities[i * 3 + 1] = dy * speed;
      burst.velocities[i * 3 + 2] = dz * speed;
      burst.lifes[i] = randomRange(0.65, 1);

      const palette = PASTEL_HSL[i % PASTEL_HSL.length];
      tempColor.setHSL(palette.h, palette.s, palette.l);
      burst.colors[i * 3 + 0] = tempColor.r;
      burst.colors[i * 3 + 1] = tempColor.g;
      burst.colors[i * 3 + 2] = tempColor.b;
    }

    (burst.geometry.getAttribute("position") as BufferAttribute).needsUpdate = true;
    (burst.geometry.getAttribute("color") as BufferAttribute).needsUpdate = true;
  };

  const update = (dt: number, elapsed: number) => {
    options.getBodyCenter(tempBody);
    options.getHeadCenter(tempHead);

    if (spiralBoost > 0) {
      spiralBoost = Math.max(0, spiralBoost - dt * 1.8);
    }

    updateLayer(ambientLayer, tempBody, dt, elapsed);
    updateLayer(headLayer, tempHead, dt, elapsed);
    updateBurst(dt, elapsed);
  };

  const setSpiralBoost = (active: boolean) => {
    spiralBoost = active ? 1 : 0;
  };

  const dispose = () => {
    scene.remove(ambientLayer.points);
    scene.remove(headLayer.points);
    scene.remove(burst.points);
    ambientLayer.geometry.dispose();
    ambientLayer.material.dispose();
    headLayer.geometry.dispose();
    headLayer.material.dispose();
    burst.geometry.dispose();
    burst.material.dispose();
    texture.dispose();
  };

  return {
    update,
    burst: burstEmit,
    setSpiralBoost,
    dispose
  };
}
