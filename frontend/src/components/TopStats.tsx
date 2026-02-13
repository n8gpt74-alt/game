import type { СостояниеПитомца } from "../types";

type StatItem = {
  key: "health" | "happiness" | "energy" | "hunger" | "hygiene";
  label: string;
  icon: string;
  color: string;
};

const STATS: StatItem[] = [
  { key: "health", label: "Здоровье", icon: "❤", color: "#ff5f85" },
  { key: "happiness", label: "Настрой", icon: "😊", color: "#ffb54a" },
  { key: "energy", label: "Энергия", icon: "⚡", color: "#67d8ff" },
  { key: "hunger", label: "Сытость", icon: "🍎", color: "#7bd37e" },
  { key: "hygiene", label: "Чистота", icon: "💧", color: "#9dc1ff" }
];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

type Props = {
  state: СостояниеПитомца | null;
};

export function TopStats({ state }: Props) {
  return (
    <section className="top-stats">
      {STATS.map((item) => {
        const value = state ? clamp(state[item.key]) : 0;
        return (
          <article key={item.key} className="stat-chip">
            <div className="stat-chip-head">
              <span className="stat-icon">{item.icon}</span>
              <span className="stat-label">{item.label}</span>
              <span className="stat-value">{value}</span>
            </div>
            <div className="stat-track">
              <i style={{ width: `${value}%`, background: item.color }} />
            </div>
          </article>
        );
      })}
    </section>
  );
}
