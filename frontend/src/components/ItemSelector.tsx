import type { ПредметИнвентаря, ТипДействия } from "../types";

type ItemSelectorProps = {
  action: ТипДействия;
  inventory: ПредметИнвентаря[];
  onSelect: (itemKey: string) => void;
  onCancel: () => void;
};

// Маппинг действий на категории предметов
const ACTION_TO_CATEGORY: Record<ТипДействия, string> = {
  feed: "food",
  wash: "wash",
  play: "toy",
  heal: "medicine",
  chat: "",
  sleep: "",
  clean: ""
};

const ACTION_TITLES: Record<ТипДействия, string> = {
  feed: "Чем покормить?",
  wash: "Чем помыть?",
  play: "Чем поиграть?",
  heal: "Чем полечить?",
  chat: "Общение",
  sleep: "Спать",
  clean: "Убрать"
};

export function ItemSelector({ action, inventory, onSelect, onCancel }: ItemSelectorProps) {
  const category = ACTION_TO_CATEGORY[action];
  
  // Фильтруем предметы по категории
  const availableItems = inventory.filter(item => {
    if (item.quantity <= 0) return false;
    return item.item_key.startsWith(`${category}_`);
  });

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="sheet-card item-selector">
        <header className="sheet-head">
          <h3>{ACTION_TITLES[action]}</h3>
          <button type="button" onClick={onCancel}>
            Отмена
          </button>
        </header>
        
        {availableItems.length === 0 ? (
          <div className="empty-state">
            <p>У вас нет подходящих предметов</p>
            <p className="hint">Купите их в магазине</p>
          </div>
        ) : (
          <div className="item-grid">
            {availableItems.map((item) => (
              <button
                key={item.item_key}
                type="button"
                className="item-card"
                onClick={() => onSelect(item.item_key)}
              >
                <div className="item-icon">
                  {getItemIcon(item.item_key)}
                </div>
                <div className="item-info">
                  <strong>{getItemTitle(item.item_key)}</strong>
                  <span className="item-quantity">×{item.quantity}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

function getItemTitle(itemKey: string): string {
  const titles: Record<string, string> = {
    // Еда
    food_apple: "Яблоко",
    food_carrot: "Морковь",
    food_candy: "Конфеты",
    food_icecream: "Мороженое",
    food_cake: "Торт",
    food_pizza: "Пицца",
    food_steak: "Стейк",
    food_sushi: "Суши",
    
    // Лекарства
    medicine_bandage: "Бинт",
    medicine_syringe: "Укол",
    medicine_potion: "Зелье",
    medicine_elixir: "Эликсир",
    
    // Средства для мытья
    wash_soap: "Мыло",
    wash_sponge: "Мочалка",
    wash_toothbrush: "Зубная щётка",
    wash_shampoo: "Шампунь",
    wash_spa: "СПА-набор",
    
    // Игрушки
    toy_ball: "Мяч",
    toy_frisbee: "Фрисби",
    toy_puzzle: "Головоломка",
    toy_guitar: "Гитара",
    toy_accordion: "Гармонь",
    toy_saxophone: "Саксофон",
    toy_drum: "Барабан",
    toy_bicycle: "Велосипед",
  };
  return titles[itemKey] || itemKey;
}
