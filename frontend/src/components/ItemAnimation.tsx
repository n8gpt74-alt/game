import { useEffect, useState } from "react";

type ItemAnimationProps = {
  itemKey: string;
  onComplete: () => void;
};

export function ItemAnimation({ itemKey, onComplete }: ItemAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Анимация длится 1.2 секунды
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isAnimating) return null;

  const icon = getItemIcon(itemKey);
  const category = getItemCategory(itemKey);
  const effect = getItemEffect(itemKey);

  return (
    <div className="item-animation">
      <div className={`item-flying ${category}`}>
        {icon}
      </div>
      {effect && <div className={`item-effect ${effect}`} />}
    </div>
  );
}

function getItemCategory(itemKey: string): string {
  if (itemKey.startsWith("food_")) return "food";
  if (itemKey.startsWith("medicine_")) return "medicine";
  if (itemKey.startsWith("wash_")) return "wash";
  if (itemKey.startsWith("toy_")) return "toy";
  return "";
}

function getItemEffect(itemKey: string): string | null {
  // Специальные эффекты для определённых предметов
  const effects: Record<string, string> = {
    // Еда - искры для особых блюд
    food_candy: "sparkles",
    food_icecream: "sparkles",
    food_cake: "sparkles",
    food_pizza: "sparkles",
    food_sushi: "sparkles",
    
    // Лекарства - крестики здоровья
    medicine_syringe: "healing",
    medicine_potion: "healing",
    medicine_elixir: "healing",
    
    // Мытьё - пузыри
    medicine_sponge: "bubbles",
    wash_toothbrush: "sparkles",
    wash_shampoo: "bubbles",
    wash_spa: "bubbles",
    
    // Игрушки - сердечки
    toy_ball: "hearts",
    toy_frisbee: "hearts",
    toy_puzzle: "hearts",
    toy_guitar: "hearts",
    toy_accordion: "hearts",
    toy_saxophone: "hearts",
    toy_drum: "hearts",
    toy_bicycle: "hearts",
  };
  return effects[itemKey] || null;
}

function getItemIcon(itemKey: string): string {
  const icons: Record<string, string> = {
    // Еда
    food_apple: "🍎",
    food_carrot: "🥕",
    food_candy: "🍬",
    food_icecream: "🍦",
    food_cake: "🍰",
    food_pizza: "🍕",
    food_steak: "🥩",
    food_sushi: "🍣",
    
    // Лекарства
    medicine_bandage: "🩹",
    medicine_syringe: "💉",
    medicine_potion: "🧪",
    medicine_elixir: "⚗️",
    
    // Средства для мытья
    wash_soap: "🧼",
    wash_sponge: "🧽",
    wash_toothbrush: "🪥",
    wash_shampoo: "🧴",
    wash_spa: "🛁",
    
    // Игрушки
    toy_ball: "⚽",
    toy_frisbee: "🥏",
    toy_puzzle: "🧩",
    toy_guitar: "🎸",
    toy_accordion: "🪗",
    toy_saxophone: "🎷",
    toy_drum: "🥁",
    toy_bicycle: "🚲",
  };
  return icons[itemKey] || "📦";
}
