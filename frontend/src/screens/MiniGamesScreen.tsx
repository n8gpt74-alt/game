import { useEffect, useMemo, useState } from "react";

import { игрыПоКатегории, КАТАЛОГ_МИНИ_ИГР, КАТЕГОРИИ_МИНИ_ИГР, найтиИгру, type КатегорияКаталогаМиниИгры } from "../features/minigames/catalog";
import type { MiniGameQuestion } from "../features/minigames/generators";
import { остановитьОзвучку, озвучитьТекст } from "../features/minigames/speech";
import type { ЗапросРезультатаМиниИгры, ТипМиниИгры } from "../types";

type Props = {
  onClose: () => void;
  onSubmitResult: (payload: ЗапросРезультатаМиниИгры) => Promise<void>;
};

export default function MiniGamesScreen({ onClose, onSubmitResult }: Props) {
  const [activeCategory, setActiveCategory] = useState<КатегорияКаталогаМиниИгры>("math");
  const [selectedType, setSelectedType] = useState<ТипМиниИгры | null>(null);
  const [question, setQuestion] = useState<MiniGameQuestion | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [speechFallback, setSpeechFallback] = useState<string | null>(null);

  const currentGame = useMemo(() => (selectedType ? найтиИгру(selectedType) : null), [selectedType]);
  const gamesInCategory = useMemo(() => игрыПоКатегории(activeCategory), [activeCategory]);

  useEffect(() => {
    if (!currentGame || currentGame.category !== "letters" || !question?.speechText) {
      setSpeechFallback(null);
      return;
    }

    const result = озвучитьТекст(question.speechText, "ru-RU");
    if (result.spoken) {
      setSpeechFallback(null);
    } else {
      setSpeechFallback(question.speechFallbackText ?? result.fallbackText ?? null);
    }

    return () => {
      остановитьОзвучку();
    };
  }, [currentGame, question?.speechText, question?.speechFallbackText]);

  const resetToCatalog = () => {
    setSelectedType(null);
    setQuestion(null);
    setRound(0);
    setScore(0);
    setStartedAt(0);
    setDone(false);
    setLocked(false);
    setSpeechFallback(null);
  };

  const start = (type: ТипМиниИгры) => {
    const game = найтиИгру(type);
    if (!game) return;

    setSelectedType(type);
    setQuestion(game.generateQuestion());
    setRound(1);
    setScore(0);
    setDone(false);
    setStartedAt(Date.now());
    setLocked(false);
    setSpeechFallback(null);
  };

  const handleAnswer = (value: string) => {
    if (!currentGame || !question || locked || done) return;

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
        setQuestion(currentGame.generateQuestion());
        setLocked(false);
      }
    }, 220);
  };

  const repeatSpeech = () => {
    if (!question?.speechText) return;
    const result = озвучитьТекст(question.speechText, "ru-RU");
    if (result.spoken) {
      setSpeechFallback(null);
    } else {
      setSpeechFallback(question.speechFallbackText ?? result.fallbackText ?? null);
    }
  };

  const finish = async () => {
    if (!selectedType || submitting) return;

    setSubmitting(true);
    try {
      const payload: ЗапросРезультатаМиниИгры = {
        game_type: selectedType,
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

  const activeCategoryMeta = useMemo(
    () => КАТЕГОРИИ_МИНИ_ИГР.find((category) => category.id === activeCategory) ?? КАТЕГОРИИ_МИНИ_ИГР[0],
    [activeCategory]
  );

  return (
    <div className="mini-overlay">
      <div className="mini-card">
        <header className="mini-head">
          <h2>Мини-игры</h2>
          <div className="mini-head-actions">
            {selectedType && (
              <button type="button" onClick={resetToCatalog}>
                К каталогу
              </button>
            )}
            <button type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </header>

        {!selectedType && (
          <>
            <div className="mini-category-tabs" role="tablist" aria-label="Категории мини-игр">
              {КАТЕГОРИИ_МИНИ_ИГР.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  className={`mini-category-tab${activeCategory === category.id ? " is-active" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <strong>{category.title}</strong>
                  <small>{category.subtitle}</small>
                </button>
              ))}
            </div>

            <p className="mini-category-note">{activeCategoryMeta.subtitle}</p>

            <div className="mini-grid">
              {gamesInCategory.map((game) => (
                <button key={game.type} className="mini-game-tile" type="button" onClick={() => start(game.type)}>
                  <strong>{game.icon}</strong>
                  <span>{game.title}</span>
                  <small>{game.subtitle}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedType && question && !done && (
          <div className="mini-round">
            <div className="mini-meta">
              <span>{currentGame?.title}</span>
              <span>
                Раунд {round}/5 • Очки: {score}
              </span>
            </div>

            <div className="mini-visual">{question.visual}</div>
            <p>{question.prompt}</p>

            {currentGame?.category === "letters" && question.speechText && (
              <div className="mini-speech-panel">
                <button type="button" onClick={repeatSpeech}>
                  🔊 Повторить озвучку
                </button>
                {speechFallback && <small>{speechFallback}</small>}
              </div>
            )}

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
