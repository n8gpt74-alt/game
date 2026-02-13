import { useEffect, useRef } from "react";

export type FxName = "hearts" | "sparkles" | "bubbles" | "hornGlow" | "healPlus" | "flash";

export type FxTrigger = {
  id: number;
  effect: FxName;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  symbol?: string;
};

type Burst = {
  particles: Particle[];
};

const MAX_BURSTS = 3;

function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createBurst(effect: FxName, width: number, height: number): Burst {
  const cx = width * 0.5;
  const cy = height * 0.54;
  const particles: Particle[] = [];

  const push = (partial: Omit<Particle, "life" | "maxLife"> & { maxLife?: number }) => {
    particles.push({
      ...partial,
      life: partial.maxLife ?? 45,
      maxLife: partial.maxLife ?? 45
    });
  };

  if (effect === "hearts") {
    for (let i = 0; i < 16; i += 1) {
      push({
        x: cx + random(-30, 30),
        y: cy + random(-18, 18),
        vx: random(-0.6, 0.6),
        vy: random(-2.5, -0.8),
        size: random(14, 24),
        color: "#ff6f96",
        symbol: "♥",
        maxLife: 48
      });
    }
  } else if (effect === "bubbles") {
    for (let i = 0; i < 18; i += 1) {
      push({
        x: cx + random(-35, 35),
        y: cy + random(-16, 10),
        vx: random(-0.5, 0.5),
        vy: random(-2.2, -0.8),
        size: random(5, 12),
        color: "#8adfff",
        maxLife: 52
      });
    }
  } else if (effect === "sparkles") {
    for (let i = 0; i < 14; i += 1) {
      push({
        x: cx + random(-40, 40),
        y: cy + random(-30, 20),
        vx: random(-0.7, 0.7),
        vy: random(-1.9, -0.3),
        size: random(8, 16),
        color: "#ffe990",
        symbol: "✦",
        maxLife: 40
      });
    }
  } else if (effect === "hornGlow") {
    for (let i = 0; i < 10; i += 1) {
      push({
        x: cx + random(16, 34),
        y: cy + random(-80, -54),
        vx: random(-0.4, 0.4),
        vy: random(-1.1, -0.2),
        size: random(10, 18),
        color: "#fff5c4",
        symbol: "✶",
        maxLife: 36
      });
    }
  } else if (effect === "healPlus") {
    for (let i = 0; i < 12; i += 1) {
      push({
        x: cx + random(-32, 32),
        y: cy + random(-22, 14),
        vx: random(-0.55, 0.55),
        vy: random(-1.7, -0.6),
        size: random(12, 18),
        color: "#95ffbf",
        symbol: "+",
        maxLife: 42
      });
    }
  } else {
    for (let i = 0; i < 12; i += 1) {
      push({
        x: cx + random(-32, 32),
        y: cy + random(-22, 14),
        vx: random(-0.8, 0.8),
        vy: random(-2.2, -1.1),
        size: random(8, 18),
        color: "#ffffff",
        maxLife: 24
      });
    }
  }

  return { particles };
}

type Props = {
  trigger: FxTrigger | null;
};

export function FxOverlay({ trigger }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const burstsRef = useRef<Burst[]>([]);
  const rafRef = useRef<number>(0);
  const lastTriggerId = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.floor(rect.width));
      canvas.height = Math.max(2, Math.floor(rect.height));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nextBursts: Burst[] = [];
      for (const burst of burstsRef.current) {
        const alive = burst.particles.filter((p) => p.life > 0);
        for (const p of alive) {
          p.life -= 1;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.025;
          const alpha = Math.max(0, p.life / p.maxLife);
          ctx.globalAlpha = alpha;
          if (p.symbol) {
            ctx.font = `${Math.floor(p.size)}px sans-serif`;
            ctx.fillStyle = p.color;
            ctx.fillText(p.symbol, p.x, p.y);
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, p.size * 0.4), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (alive.length > 0) {
          burst.particles = alive;
          nextBursts.push(burst);
        }
      }
      ctx.globalAlpha = 1;
      burstsRef.current = nextBursts;
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!trigger || !canvas) return;
    if (trigger.id === lastTriggerId.current) return;
    lastTriggerId.current = trigger.id;

    if (burstsRef.current.length >= MAX_BURSTS) {
      burstsRef.current.shift();
    }
    burstsRef.current.push(createBurst(trigger.effect, canvas.width, canvas.height));
  }, [trigger]);

  return <canvas className="fx-overlay" ref={canvasRef} />;
}
