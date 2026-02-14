import type { ТипДействия } from "../types";

type ActionDockAction = {
  id: ТипДействия;
  label: string;
  icon: string;
};

const ACTIONS: ActionDockAction[] = [
  { id: "feed", label: "Кормить", icon: "🍎" },
  { id: "wash", label: "Мыть", icon: "🚿" },
  { id: "play", label: "Играть", icon: "🎮" },
  { id: "heal", label: "Лечить", icon: "✨" },
  { id: "sleep", label: "Спать", icon: "😴" }
];

type Props = {
  disabled: boolean;
  activeAction: ТипДействия | null;
  cooldowns: {
    wash: number;
    mini: number;
  };
  onAction: (action: ТипДействия) => void;
  onMiniGames: () => void;
};

function formatCooldown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function ActionDock({ disabled, activeAction, cooldowns, onAction, onMiniGames }: Props) {
  return (
    <footer className="action-dock">
      {ACTIONS.map((action) => {
        const remaining = action.id === "wash" ? cooldowns.wash : 0;
        const locked = disabled || remaining > 0;
        return (
          <button
            key={action.id}
            className={`action-btn ${activeAction === action.id ? "is-active" : ""}`}
            type="button"
            disabled={locked}
            onClick={() => onAction(action.id)}
          >
            <span className="emoji">{action.icon}</span>
            <span>{action.label}</span>
            {remaining > 0 && <small className="action-timer">{formatCooldown(remaining)}</small>}
          </button>
        );
      })}

      <button className="action-btn mini" type="button" disabled={disabled || cooldowns.mini > 0} onClick={onMiniGames}>
        <span className="emoji">🧩</span>
        <span>Мини-игры</span>
        {cooldowns.mini > 0 && <small className="action-timer">{formatCooldown(cooldowns.mini)}</small>}
      </button>
    </footer>
  );
}
