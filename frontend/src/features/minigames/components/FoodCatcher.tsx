import React, { useState, useEffect, useCallback, useRef } from "react";

type ItemType = "food" | "bomb";
type DropItem = {
  id: string;
  type: ItemType;
  emoji: string;
  x: number;
  y: number;
  speed: number;
};

const FOOD_EMOJIS = ["🍎", "🥕", "🍓", "🍉", "🍒", "🥦", "🍇"];
const BOMB_EMOJI = "💣";
const GAME_DURATION = 30; // seconds

type Props = {
  onFinish: (score: number) => void;
};

export default function FoodCatcher({ onFinish }: Props) {
  const [items, setItems] = useState<DropItem[]>([]);
  const [points, setPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const requestRef = useRef<number>();
  const spawnRateRef = useRef(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const lastSpawnRef = useRef<number>(Date.now());

  const startGame = () => {
    setIsPlaying(true);
    setPoints(0);
    setTimeLeft(GAME_DURATION);
    setItems([]);
    lastTimeRef.current = Date.now();
    lastSpawnRef.current = Date.now();
  };

  const handleCatch = (id: string, type: ItemType, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isPlaying) return;
    
    if (type === "food") {
      setPoints(p => p + 1);
    } else {
      setPoints(p => Math.max(0, p - 3));
    }
    setItems(items => items.filter(i => i.id !== id));
  };

  const gameLoop = useCallback(() => {
    if (!isPlaying) return;

    const now = Date.now();
    const dt = now - lastTimeRef.current;
    lastTimeRef.current = now;

    if (now - lastSpawnRef.current > spawnRateRef.current) {
      lastSpawnRef.current = now;
      const isBomb = Math.random() < 0.25;
      const emoji = isBomb ? BOMB_EMOJI : FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      
      const width = containerRef.current?.clientWidth || 300;
      
      const newItem: DropItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: isBomb ? "bomb" : "food",
        emoji,
        x: 10 + Math.random() * (width - 50),
        y: -40,
        speed: (2 + Math.random() * 3) * (dt / 16.6), 
      };
      setItems(prev => [...prev, newItem]);
    }

    setItems(prev => 
      prev
        .map(item => ({ ...item, y: item.y + item.speed }))
        .filter(item => item.y < (containerRef.current?.clientHeight || 400) + 50)
    );
    
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameLoop]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsPlaying(false);
          clearInterval(timer);
          
          let finalScoreContext = 0;
          if (points >= 15) finalScoreContext = 5;
          else if (points >= 11) finalScoreContext = 4;
          else if (points >= 7) finalScoreContext = 3;
          else if (points >= 4) finalScoreContext = 2;
          else if (points > 0) finalScoreContext = 1;
          
          setTimeout(() => onFinish(finalScoreContext), 1000);
          return 0;
        }
        return t - 1;
      });
      spawnRateRef.current = Math.max(300, 800 - (GAME_DURATION - timeLeft) * 20);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPlaying, points, timeLeft, onFinish]);

  if (!isPlaying && timeLeft === GAME_DURATION) {
    return (
      <div className="mini-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '15px' }}>
        <h3 style={{ margin: 0 }}>Ловец Еды</h3>
        <p style={{ textAlign: 'center', margin: 0 }}>Лови падающую еду! Взрывов избегай 💣</p>
        <button type="button" onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '12px' }}>Начать</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '350px', width: '100%', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '16px' }} ref={containerRef}>
      <div style={{ position: 'absolute', top: 10, left: 15, zIndex: 10, fontWeight: 'bold', fontSize: '18px', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: '10px' }}>
        🍎 {points}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 15, zIndex: 10, fontWeight: 'bold', fontSize: '18px', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: '10px' }}>
        ⏱️ {timeLeft}
      </div>
      
      {!isPlaying && timeLeft === 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 20 }}>
          <h2 style={{ color: '#ff6b6b' }}>Время вышло!</h2>
        </div>
      )}

      {items.map(item => (
        <div 
          key={item.id} 
          onMouseDown={(e) => handleCatch(item.id, item.type, e)}
          onTouchStart={(e) => handleCatch(item.id, item.type, e)}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            fontSize: '36px',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none'
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
