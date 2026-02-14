from dataclasses import dataclass


@dataclass
class ShopItem:
    item_key: str
    title: str
    section: str
    base_price: int
    level_required: int


CATALOG: list[ShopItem] = [
    # Еда
    ShopItem("food_apple", "🍎 Яблоко", "Еда", 5, 1),
    ShopItem("food_carrot", "🥕 Морковь", "Еда", 8, 1),
    ShopItem("food_candy", "🍬 Конфеты", "Еда", 10, 1),
    ShopItem("food_icecream", "🍦 Мороженое", "Еда", 12, 2),
    ShopItem("food_cake", "🍰 Торт", "Еда", 15, 2),
    ShopItem("food_pizza", "🍕 Пицца", "Еда", 20, 3),
    ShopItem("food_steak", "🥩 Стейк", "Еда", 30, 5),
    ShopItem("food_sushi", "🍣 Суши", "Еда", 40, 7),
    
    # Лекарства
    ShopItem("medicine_bandage", "🩹 Бинт", "Лекарства", 10, 1),
    ShopItem("medicine_syringe", "💉 Укол", "Лекарства", 18, 2),
    ShopItem("medicine_potion", "🧪 Зелье", "Лекарства", 25, 2),
    ShopItem("medicine_elixir", "⚗️ Эликсир", "Лекарства", 50, 5),
    
    # Средства для мытья
    ShopItem("wash_soap", "🧼 Мыло", "Гигиена", 8, 1),
    ShopItem("wash_sponge", "🧽 Мочалка", "Гигиена", 10, 1),
    ShopItem("wash_toothbrush", "🪥 Зубная щётка", "Гигиена", 12, 1),
    ShopItem("wash_shampoo", "🧴 Шампунь", "Гигиена", 15, 2),
    ShopItem("wash_spa", "🛁 СПА-набор", "Гигиена", 35, 4),
    
    # Игрушки
    ShopItem("toy_ball", "⚽ Мяч", "Игрушки", 12, 1),
    ShopItem("toy_frisbee", "🥏 Фрисби", "Игрушки", 18, 2),
    ShopItem("toy_puzzle", "🧩 Головоломка", "Игрушки", 25, 3),
    ShopItem("toy_guitar", "🎸 Гитара", "Игрушки", 30, 3),
    ShopItem("toy_accordion", "🪗 Гармонь", "Игрушки", 35, 4),
    ShopItem("toy_saxophone", "🎷 Саксофон", "Игрушки", 40, 5),
    ShopItem("toy_drum", "🥁 Барабан", "Игрушки", 28, 3),
    ShopItem("toy_bicycle", "🚲 Велосипед", "Игрушки", 50, 6),
    
    # Украшения
    ShopItem("decor_star_halo", "⭐ Звёздный венок", "Украшения", 35, 1),
    ShopItem("decor_moon_tiara", "🌙 Лунная тиара", "Украшения", 65, 4),
    ShopItem("horn_glow_amber", "✨ Янтарное сияние", "Эффекты рога", 50, 3),
    ShopItem("horn_glow_aurora", "🌈 Аврора-свечение", "Эффекты рога", 90, 7),
    ShopItem("theme_spring_room", "🌸 Весенняя комната", "Темы комнаты", 70, 5),
    ShopItem("theme_crystal_room", "💎 Кристальная комната", "Темы комнаты", 120, 10),
    ShopItem("acc_scarf_sky", "🧣 Небесный шарф", "Аксессуары", 45, 2),
    ShopItem("acc_boots_cloud", "👢 Облачные ботинки", "Аксессуары", 80, 8),
]


def price_for_level(base_price: int, level: int) -> int:
    level_factor = 1.8 ** max(1, level)
    return int(round(base_price * level_factor))


def find_item(item_key: str) -> ShopItem | None:
    for item in CATALOG:
        if item.item_key == item_key:
            return item
    return None



# Эффекты предметов (бонусы к базовым значениям)
ITEM_EFFECTS = {
    # Еда - влияет на голод и настроение
    "food_apple": {"hunger": 15, "happiness": 2},
    "food_carrot": {"hunger": 18, "happiness": 3},
    "food_candy": {"hunger": 12, "happiness": 8},  # Много счастья, мало сытости
    "food_icecream": {"hunger": 20, "happiness": 10},
    "food_cake": {"hunger": 25, "happiness": 8},
    "food_pizza": {"hunger": 30, "happiness": 10},
    "food_steak": {"hunger": 35, "happiness": 12},
    "food_sushi": {"hunger": 40, "happiness": 15},
    
    # Лекарства - влияет на здоровье и энергию
    "medicine_bandage": {"health": 20, "energy": 5},
    "medicine_syringe": {"health": 30, "energy": 8},
    "medicine_potion": {"health": 35, "energy": 10},
    "medicine_elixir": {"health": 50, "energy": 20},
    
    # Средства для мытья - влияет на чистоту и настроение
    "wash_soap": {"hygiene": 25, "happiness": 3},
    "wash_sponge": {"hygiene": 28, "happiness": 4},
    "wash_toothbrush": {"hygiene": 30, "happiness": 5, "health": 3},
    "wash_shampoo": {"hygiene": 35, "happiness": 5},
    "wash_spa": {"hygiene": 50, "happiness": 10, "health": 5},
    
    # Игрушки - влияет на настроение и энергию
    "toy_ball": {"happiness": 18, "energy": -8},
    "toy_frisbee": {"happiness": 22, "energy": -10},
    "toy_puzzle": {"happiness": 25, "energy": -5, "intelligence": 1},
    "toy_guitar": {"happiness": 28, "energy": -12, "intelligence": 2},
    "toy_accordion": {"happiness": 30, "energy": -10, "intelligence": 2},
    "toy_saxophone": {"happiness": 32, "energy": -15, "intelligence": 3},
    "toy_drum": {"happiness": 26, "energy": -14},
    "toy_bicycle": {"happiness": 35, "energy": -20, "health": 5},
}


def get_item_category(item_key: str) -> str:
    """Определить категорию предмета"""
    if item_key.startswith("food_"):
        return "food"
    elif item_key.startswith("medicine_"):
        return "medicine"
    elif item_key.startswith("wash_"):
        return "wash"
    elif item_key.startswith("toy_"):
        return "toy"
    else:
        return "cosmetic"


def get_item_effects(item_key: str) -> dict[str, int]:
    """Получить эффекты предмета"""
    return ITEM_EFFECTS.get(item_key, {})


def is_consumable(item_key: str) -> bool:
    """Проверить, является ли предмет расходным"""
    category = get_item_category(item_key)
    return category in ["food", "medicine", "wash", "toy"]
