import React, { useState, useEffect } from "react";

type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const EMOJIS = ["🍎", "🥦", "🎪", "🚗", "⭐", "⚡"];

type Props = {
  onFinish: (score: number) => void;
};

export default function MemoryPairs({ onFinish }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const startGame = () => {
    const deck = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({
        id: idx,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(deck);
    setFlippedIds([]);
    setTimeLeft(35);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          clearInterval(t);
          
          const matched = cards.filter(c => c.isMatched).length / 2;
          let s = 0;
          if (matched >= 6) s = 5;
          else if (matched >= 4) s = 3;
          else if (matched >= 2) s = 1;
          
          setTimeout(() => onFinish(s), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying, cards, onFinish]);

  useEffect(() => {
    if (flippedIds.length === 2) {
      const [id1, id2] = flippedIds;
      const card1 = cards.find(c => c.id === id1);
      const card2 = cards.find(c => c.id === id2);

      if (card1 && card2 && card1.emoji === card2.emoji) {
        setCards(prev => prev.map(c => 
          c.id === id1 || c.id === id2 ? { ...c, isMatched: true } : c
        ));
        setFlippedIds([]);
      } else {
        const timer = setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c
          ));
          setFlippedIds([]);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [flippedIds, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      setIsPlaying(false);
      let s = 5;
      if (timeLeft > 20) s = 5;
      else if (timeLeft > 10) s = 4;
      else s = 3;
      setTimeout(() => onFinish(s), 1000);
    }
  }, [cards, timeLeft, onFinish]);

  const handleCardClick = (id: number) => {
    if (!isPlaying || flippedIds.length >= 2 || flippedIds.includes(id)) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedIds(prev => [...prev, id]);
  };

  if (!isPlaying && timeLeft === 30) {
    return (
      <div className="mini-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '15px' }}>
        <h3 style={{ margin: 0 }}>Парочки</h3>
        <p style={{ textAlign: 'center', margin: 0 }}>Найди пару для каждой карточки!</p>
        <button type="button" onClick={startGame} style={{ padding: '10px 20px', fontSize: '18px', borderRadius: '12px' }}>Начать</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '0 10px' }}>
        <strong>Парочки</strong>
        <strong style={{ color: timeLeft <= 5 ? '#ff4757' : 'inherit' }}>⏱️ {timeLeft}</strong>
      </div>
      
      {!isPlaying && timeLeft === 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 20 }}>
          <h2 style={{ color: '#ff6b6b' }}>Время вышло!</h2>
        </div>
      )}

      {!isPlaying && cards.every(c => c.isMatched && c.isMatched === true) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 20 }}>
          <h2 style={{ color: '#2ed573' }}>Победа!</h2>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {cards.map(card => (
          <div 
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            style={{
              aspectRatio: '1',
              backgroundColor: card.isFlipped || card.isMatched ? '#fff' : '#4a69bd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s'
            }}
          >
            {(card.isFlipped || card.isMatched) ? card.emoji : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
