import React, { useState, useEffect, useRef } from "react";

type Props = {
  onFinish: (score: number) => void;
};

const GRID_SIZE = 3;

function generatePattern() {
  const pattern: boolean[] = new Array(GRID_SIZE * GRID_SIZE).fill(false);
  const numFilled = 3 + Math.floor(Math.random() * 3); // 3 to 5 cells filled
  let count = 0;
  while (count < numFilled) {
    const idx = Math.floor(Math.random() * pattern.length);
    if (!pattern[idx]) {
      pattern[idx] = true;
      count++;
    }
  }
  return pattern;
}

export default function PixelPattern({ onFinish }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const roundRef = useRef(1);
  const [targetPattern, setTargetPattern] = useState<boolean[]>([]);
  const [playerPattern, setPlayerPattern] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isLocked, setIsLocked] = useState(false);

  // Keep refs in sync so timer callbacks always read fresh values
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { roundRef.current = round; }, [round]);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, round]);

  const startGame = () => {
    setIsPlaying(true);
    setRound(1);
    roundRef.current = 1;
    setScore(0);
    scoreRef.current = 0;
    setTargetPattern(generatePattern());
    setPlayerPattern(new Array(GRID_SIZE * GRID_SIZE).fill(false));
    setTimeLeft(10);
    setIsLocked(false);
  };

  const handleTimeUp = () => {
    setIsLocked(true);
    const currentScore = scoreRef.current;
    setTimeout(() => {
      nextRound(currentScore);
    }, 500);
  };

  const nextRound = (currentScore: number) => {
    if (roundRef.current >= 5) {
      setIsPlaying(false);
      onFinish(currentScore);
    } else {
      const nextRoundNum = roundRef.current + 1;
      roundRef.current = nextRoundNum;
      setRound(nextRoundNum);
      setTargetPattern(generatePattern());
      setPlayerPattern(new Array(GRID_SIZE * GRID_SIZE).fill(false));
      setTimeLeft(10);
      setIsLocked(false);
    }
  };

  const checkMatch = (pattern: boolean[]) => {
    return pattern.every((val, i) => val === targetPattern[i])
        && targetPattern.every((val, i) => val === pattern[i]);
  };

  const toggleCell = (idx: number) => {
    if (!isPlaying || isLocked) return;

    const newPattern = [...playerPattern];
    newPattern[idx] = !newPattern[idx];
    setPlayerPattern(newPattern);

    if (checkMatch(newPattern)) {
      setIsLocked(true);
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      setTimeout(() => {
        nextRound(newScore);
      }, 500);
    }
  };

  if (!isPlaying && round === 1 && score === 0) {
    return (
      <div className="mini-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '15px' }}>
        <h3 style={{ margin: 0 }}>Собери Узор</h3>
        <p style={{ textAlign: 'center', margin: 0 }}>Повтори узор за 10 секунд! Всего 5 раундов.</p>
        <button type="button" onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '12px' }}>Начать</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Раунд {round}/5</strong>
        <strong>Очки: {score}</strong>
        <strong style={{ color: timeLeft <= 3 ? '#ff4757' : 'inherit' }}>⏱️ {timeLeft}</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <small style={{ marginBottom: '10px' }}>Образец</small>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: '4px', width: '100%', maxWidth: '120px' }}>
            {targetPattern.map((active, i) => (
              <div
                key={`target-${i}`}
                style={{
                  aspectRatio: '1',
                  backgroundColor: active ? '#2ed573' : '#dfe4ea',
                  borderRadius: '4px'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <small style={{ marginBottom: '10px' }}>Твое поле</small>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: '4px', width: '100%', maxWidth: '120px' }}>
            {playerPattern.map((active, i) => (
              <div
                key={`player-${i}`}
                onClick={() => toggleCell(i)}
                style={{
                  aspectRatio: '1',
                  backgroundColor: active ? '#1e90ff' : '#ffffff',
                  border: '2px solid #dfe4ea',
                  cursor: isLocked ? 'default' : 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.1s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {isLocked && checkMatch(playerPattern) && (
        <div style={{ textAlign: 'center', color: '#2ed573', fontWeight: 'bold' }}>Правильно!</div>
      )}
    </div>
  );
}
