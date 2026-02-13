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

export interface DragonParticlesController {
  points: Points;
  update: (dt: number, elapsed: number) => void;
  burst: (type?: ParticleBurstType) => void;
  dispose: () => void;
}

type CenterProvider = (target: Vector3) => Vector3;

const COLOR_PALETTE = ["#ffffff", "#ffd1ff", "#bde7ff", "#fff2b3"];

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticleTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Не удалось создать canvas для текстуры частиц");
  }

  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.9)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function initParticles(scene: Scene, centerProvider: CenterProvider): DragonParticlesController {
  const count = 180;
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const angles = new Float32Array(count);
  const heights = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);
  const jitters = new Float32Array(count);

  const colorObjects = COLOR_PALETTE.map((hex) => new Color(hex));

  for (let i = 0; i < count; i += 1) {
    const c = colorObjects[i % colorObjects.length];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    angles[i] = randomRange(0, Math.PI * 2);
    heights[i] = randomRange(0.05, 1.7);
    radii[i] = randomRange(0.28, 0.78);
    speeds[i] = randomRange(0.45, 1.15);
    jitters[i] = randomRange(0.02, 0.08);
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));

  const texture = createParticleTexture();
  const material = new PointsMaterial({
    map: texture,
    size: 0.09,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    vertexColors: true,
    blending: AdditiveBlending,
    sizeAttenuation: true
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  scene.add(points);

  let burstUntil = 0;
  let burstPower = 1;
  const center = new Vector3();

  const update = (dt: number, elapsed: number) => {
    centerProvider(center);

    const now = performance.now();
    const inBurst = now < burstUntil;
    const burstFactor = inBurst ? burstPower : 1;
    material.opacity = inBurst ? 0.9 : 0.72;

    for (let i = 0; i < count; i += 1) {
      const speed = speeds[i] * burstFactor;
      angles[i] += dt * speed;
      heights[i] += dt * (0.22 + speeds[i] * 0.18) * burstFactor;

      if (heights[i] > 1.95) {
        heights[i] = randomRange(0.04, 0.22);
        radii[i] = randomRange(0.24, 0.8);
        angles[i] = randomRange(0, Math.PI * 2);
      }

      const spiralRadius = radii[i] + Math.sin(elapsed * 1.35 + i * 0.19) * 0.04;
      const jitter = Math.sin(elapsed * 3.6 + i * 1.77) * jitters[i];

      positions[i * 3 + 0] = center.x + Math.cos(angles[i]) * spiralRadius + jitter;
      positions[i * 3 + 1] = center.y + heights[i] + Math.cos(elapsed * 2.1 + i * 0.57) * 0.03;
      positions[i * 3 + 2] = center.z + Math.sin(angles[i]) * spiralRadius + Math.sin(elapsed * 2.4 + i * 0.91) * jitters[i];
    }

    const positionAttr = geometry.getAttribute("position") as BufferAttribute;
    positionAttr.needsUpdate = true;
  };

  const burst = (type: ParticleBurstType = "play") => {
    burstPower = type === "evolve" ? 2.8 : type === "heal" ? 2.4 : type === "mini" ? 2.2 : 2.0;
    burstUntil = performance.now() + 600;
  };

  const dispose = () => {
    scene.remove(points);
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };

  return { points, update, burst, dispose };
}
