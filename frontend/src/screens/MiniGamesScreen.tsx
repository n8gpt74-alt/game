import { useMemo, useState } from "react";
import type { ЗапросРезультатаМиниИгры } from "../types";

type GameType = ЗапросРезультатаМиниИгры["game_type"];

type Question = {
  prompt: string;
  visual: string;
  options: string[];
  answer: string;
};

const GAME_META: Array<{ type: GameType; title: string; subtitle: string; icon: string }> = [
  { type: "count_2_4", title: "Счёт 2-4", subtitle: "Посчитай предметы", icon: "🔢" },
  { type: "sum_4_6", title: "Сложение 4-6", subtitle: "Выбери правильную сумму", icon: "➕" },
  { type: "compare", title: "Сравнение", subtitle: "Что больше?", icon: "⚖️" },
  { type: "fast_count_6_8", title: "Быстрый счёт 6-8", subtitle: "Ответь быстро", icon: "⏱️" }
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

function makeCountQuestion(minCount: number, maxCount: number): Question {
  const count = randomInt(minCount, maxCount);
  const options = shuffle([
    String(count),
    String(Math.max(minCount, count - 1)),
    String(Math.min(maxCount, count + 1))
  ]);
  return {
    prompt: "Сколько предметов на экране?",
    visual: "⭐".repeat(count),
    options,
    answer: String(count)
  };
}

function makeSumQuestion(): Question {
  const a = randomInt(1, 3);
  const b = randomInt(3, 5);
  const correct = a + b;
  const options = shuffle([String(correct), String(correct - 1), String(correct + 1)]);
  return {
    prompt: `${a} + ${b} = ?`,
    visual: "🧁".repeat(a) + " + " + "🍓".repeat(b),
    options,
    answer: String(correct)
  };
}

function makeCompareQuestion(): Question {
  const left = randomInt(2, 9);
  const right = randomInt(2, 9);
  let answer = "=";
  if (left > right) answer = ">";
  if (left < right) answer = "<";
  return {
    prompt: "Выбери верный знак",
    visual: `${left} ? ${right}`,
    options: [">", "<", "="],
    answer
  };
}

function makeQuestion(type: GameType): Question {
  if (type === "count_2_4") return makeCountQuestion(2, 4);
  if (type === "sum_4_6") return makeSumQuestion();
  if (type === "compare") return makeCompareQuestion();
  return makeCountQuestion(6, 8);
}

type Props = {
  onClose: () => void;
  onSubmitResult: (payload: ЗапросРезультатаМиниИгры) => Promise<void>;
};

export default function MiniGamesScreen({ onClose, onSubmitResult }: Props) {
  const [selected, setSelected] = useState<GameType | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentMeta = useMemo(() => GAME_META.find((item) => item.type === selected) ?? null, [selected]);

  const start = (type: GameType) => {
    setSelected(type);
    setQuestion(makeQuestion(type));
    setRound(1);
    setScore(0);
    setDone(false);
    setStartedAt(Date.now());
    setLocked(false);
  };

  const handleAnswer = (value: string) => {
    if (!selected || !question || locked || done) return;
    setLocked(true);
    const correct = value === question.answer;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);

    window.setTimeout(() => {
      if (round >= 5) {
        setDone(true);
        setLocked(false);
      } else {
        setRound((prev) => prev + 1);
        setQuestion(makeQuestion(selected));
        setLocked(false);
      }
    }, 220);
  };

  const finish = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const payload: ЗапросРезультатаМиниИгры = {
        game_type: selected,
        score,
        elapsed_ms: Math.max(1000, Date.now() - startedAt),
        source: "math"
      };
      await onSubmitResult(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mini-overlay">
      <div className="mini-card">
        <header className="mini-head">
          <h2>Мини-игры</h2>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </header>

        {!selected && (
          <div className="mini-grid">
            {GAME_META.map((game) => (
              <button key={game.type} className="mini-game-tile" type="button" onClick={() => start(game.type)}>
                <strong>{game.icon}</strong>
                <span>{game.title}</span>
                <small>{game.subtitle}</small>
              </button>
            ))}
          </div>
        )}

        {selected && question && !done && (
          <div className="mini-round">
            <div className="mini-meta">
              <span>{currentMeta?.title}</span>
              <span>
                Раунд {round}/5 • Очки: {score}
              </span>
            </div>
            <div className="mini-visual">{question.visual}</div>
            <p>{question.prompt}</p>
            <div className="mini-options">
              {question.options.map((option) => (
                <button key={option} type="button" disabled={locked} onClick={() => handleAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {done && (
          <div className="mini-result">
            <h3>Готово!</h3>
            <p>Правильных ответов: {score} из 5</p>
            <button type="button" disabled={submitting} onClick={finish}>
              {submitting ? "Отправка..." : "Забрать награду"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
