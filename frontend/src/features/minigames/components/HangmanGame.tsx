import { useState, useEffect, useCallback } from "react";

const WORDS = [
  { word: "ДРАКОН", hint: "Мифическое существо с крыльями" },
  { word: "ЗАМОК", hint: "Крепость с башнями" },
  { word: "ЗВЕЗДА", hint: "Светит ночью на небе" },
  { word: "РАДУГА", hint: "Цветная дуга после дождя" },
  { word: "ВОЛШЕБНИК", hint: "Маг со шляпой" },
  { word: "ПИРАТЫ", hint: "Морские разбойники" },
  { word: "СОКРОВИЩЕ", hint: "Спрятан в сундуке" },
  { word: "РЫЦАРЬ", hint: "Воин в доспехах" },
  { word: "ПРИНЦЕССА", hint: "Живёт в замке" },
  { word: "ЕДИНОРОГ", hint: "Конь с рогом" },
];

const MAX_ERRORS = 6;

const HangmanSVG = ({ errors }: { errors: number }) => (
  <svg viewBox="0 0 120 140" style={{ width: "100%", maxWidth: 180, margin: "0 auto", display: "block" }}>
    {/* Виселица */}
    <line x1="10" y1="130" x2="110" y2="130" stroke="var(--text-soft)" strokeWidth="4" strokeLinecap="round" />
    <line x1="40" y1="130" x2="40" y2="10" stroke="var(--text-soft)" strokeWidth="4" strokeLinecap="round" />
    <line x1="40" y1="10" x2="80" y2="10" stroke="var(--text-soft)" strokeWidth="4" strokeLinecap="round" />
    <line x1="80" y1="10" x2="80" y2="28" stroke="var(--text-soft)" strokeWidth="3" strokeLinecap="round" />
    {/* Голова */}
    {errors >= 1 && <circle cx="80" cy="38" r="10" stroke="var(--primary)" strokeWidth="3" fill="none" />}
    {/* Тело */}
    {errors >= 2 && <line x1="80" y1="48" x2="80" y2="88" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />}
    {/* Левая рука */}
    {errors >= 3 && <line x1="80" y1="60" x2="60" y2="76" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />}
    {/* Правая рука */}
    {errors >= 4 && <line x1="80" y1="60" x2="100" y2="76" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />}
    {/* Левая нога */}
    {errors >= 5 && <line x1="80" y1="88" x2="62" y2="112" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />}
    {/* Правая нога */}
    {errors >= 6 && <line x1="80" y1="88" x2="98" y2="112" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />}
  </svg>
);

const ALPHABET = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("");

type Props = {
  onFinish: (score: number) => void;
};

export default function HangmanGame({ onFinish }: Props) {
  const [wordIndex] = useState(() => Math.floor(Math.random() * WORDS.length));
  const { word, hint } = WORDS[wordIndex];
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState(0);

  const won = word.split("").every((l) => guessed.has(l));
  const lost = errors >= MAX_ERRORS;

  const guess = useCallback((letter: string) => {
    if (guessed.has(letter) || won || lost) return;
    setGuessed((prev) => new Set([...prev, letter]));
    if (!word.includes(letter)) {
      setErrors((e) => e + 1);
    }
  }, [guessed, won, lost, word]);

  useEffect(() => {
    if (won) {
      setTimeout(() => onFinish(5), 800);
    } else if (lost) {
      setTimeout(() => onFinish(0), 800);
    }
  }, [won, lost, onFinish]);

  const correctLetters = word.split("").filter((l) => guessed.has(l)).length;
  const score = Math.min(5, Math.round((correctLetters / word.length) * 5));

  return (
    <div style={{ display: "grid", gap: 12, padding: 4 }}>
      <p style={{ textAlign: "center", color: "var(--text-soft)", fontSize: 13, margin: 0 }}>
        💡 {hint}
      </p>

      <HangmanSVG errors={errors} />

      {/* Слово */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
        {word.split("").map((letter, i) => (
          <div key={i} style={{
            minWidth: 28, height: 36, borderBottom: "3px solid var(--primary)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            fontSize: 22, fontWeight: 800, color: guessed.has(letter) ? "var(--text-main)" : "transparent",
            transition: "color 0.3s",
          }}>
            {letter}
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-soft)", margin: 0 }}>
        Ошибок: {errors} / {MAX_ERRORS}
      </p>

      {/* Буквы */}
      {!won && !lost && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              disabled={guessed.has(letter)}
              onClick={() => guess(letter)}
              style={{
                width: 32, height: 32,
                borderRadius: 8,
                border: "1px solid var(--panel-border)",
                background: guessed.has(letter)
                  ? (word.includes(letter) ? "var(--primary)" : "rgba(255,80,80,0.15)")
                  : "var(--panel-bg)",
                color: guessed.has(letter) ? (word.includes(letter) ? "#fff" : "rgba(200,50,50,0.8)") : "var(--text-main)",
                fontWeight: 700,
                fontSize: 12,
                cursor: guessed.has(letter) ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {won && (
        <p style={{ textAlign: "center", fontSize: 22, fontWeight: 800 }}>🎉 Победа!</p>
      )}
      {lost && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#c0392b" }}>💀 Проигрыш!</p>
          <p style={{ color: "var(--text-soft)" }}>Слово было: <strong>{word}</strong></p>
        </div>
      )}
    </div>
  );
}
