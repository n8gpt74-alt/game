import { useState, useEffect, useCallback } from "react";

type Cell = "X" | "O" | null;

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Cell[]): "X" | "O" | "draw" | null {
  for (const [a, b, c] of WINS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as "X" | "O";
  }
  if (board.every((c) => c !== null)) return "draw";
  return null;
}

function getBestMove(board: Cell[], aiMark: "X" | "O"): number {
  const humanMark = aiMark === "O" ? "X" : "O";

  function minimax(b: Cell[], isMaximizing: boolean): number {
    const result = checkWinner(b);
    if (result === aiMark) return 10;
    if (result === humanMark) return -10;
    if (result === "draw") return 0;

    const scores: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        const copy = [...b] as Cell[];
        copy[i] = isMaximizing ? aiMark : humanMark;
        scores.push(minimax(copy, !isMaximizing));
      }
    }
    return isMaximizing ? Math.max(...scores) : Math.min(...scores);
  }

  let best = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = [...board] as Cell[];
      copy[i] = aiMark;
      const score = minimax(copy, false);
      if (score > best) { best = score; bestMove = i; }
    }
  }
  return bestMove;
}

type Props = {
  onFinish: (score: number) => void;
};

export default function TicTacToe({ onFinish }: Props) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [playerMark] = useState<"X" | "O">("X");
  const [aiMark] = useState<"X" | "O">("O");
  const [playerTurn, setPlayerTurn] = useState(true);
  const [result, setResult] = useState<"X" | "O" | "draw" | null>(null);

  const handleClick = useCallback((index: number) => {
    if (!playerTurn || board[index] || result) return;
    const newBoard = [...board] as Cell[];
    newBoard[index] = playerMark;
    setBoard(newBoard);
    const winner = checkWinner(newBoard);
    if (winner) { setResult(winner); return; }
    setPlayerTurn(false);
  }, [board, playerTurn, playerMark, result]);

  // AI move
  useEffect(() => {
    if (playerTurn || result) return;
    const timer = setTimeout(() => {
      const move = getBestMove(board, aiMark);
      if (move === -1) return;
      const newBoard = [...board] as Cell[];
      newBoard[move] = aiMark;
      setBoard(newBoard);
      const winner = checkWinner(newBoard);
      if (winner) { setResult(winner); return; }
      setPlayerTurn(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [playerTurn, board, aiMark, result]);

  useEffect(() => {
    if (result) {
      const score = result === playerMark ? 5 : result === "draw" ? 2 : 0;
      setTimeout(() => onFinish(score), 1000);
    }
  }, [result, playerMark, onFinish]);

  const winLine = WINS.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);

  return (
    <div style={{ display: "grid", gap: 12, padding: 4 }}>
      <p style={{ textAlign: "center", color: "var(--text-soft)", margin: 0, fontSize: 14 }}>
        Ты — <strong style={{ color: "var(--primary)" }}>✕</strong> · Бот — <strong style={{ color: "#e05a5a" }}>○</strong>
        {result ? (
          result === playerMark ? " 🎉 Ты победил!" :
          result === "draw" ? " 🤝 Ничья!" : " 😥 Бот победил"
        ) : playerTurn ? " · Твой ход" : " · Ход бота..."}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        maxWidth: 240,
        margin: "0 auto",
        width: "100%",
      }}>
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(i)}
              style={{
                aspectRatio: "1",
                borderRadius: 16,
                border: "2px solid var(--panel-border)",
                background: isWinCell
                  ? "linear-gradient(135deg, rgba(110,133,255,0.3), rgba(80,120,255,0.15))"
                  : "var(--panel-bg)",
                fontSize: "clamp(28px, 8vw, 44px)",
                fontWeight: 900,
                color: cell === playerMark ? "var(--primary)" : "#e05a5a",
                cursor: cell || !playerTurn || result ? "default" : "pointer",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isWinCell ? "scale(1.06)" : "scale(1)",
                boxShadow: isWinCell ? "0 4px 16px rgba(110,133,255,0.3)" : "var(--shadow)",
              }}
            >
              {cell === "X" ? "✕" : cell === "O" ? "○" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
