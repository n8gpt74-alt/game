from dataclasses import dataclass


@dataclass
class ShopItem:
    item_key: str
    title: str
    section: str
    base_price: int
    level_required: int


CATALOG: list[ShopItem] = [
    # ===== Еда =====
    ShopItem("food_apple", "🍎 Яблоко", "Еда", 5, 1),
    ShopItem("food_carrot", "🥕 Морковь", "Еда", 8, 1),
    ShopItem("food_candy", "🍬 Конфеты", "Еда", 10, 1),
    ShopItem("food_icecream", "🍦 Мороженое", "Еда", 12, 2),
    ShopItem("food_cake", "🍰 Торт", "Еда", 15, 2),
    ShopItem("food_pizza", "🍕 Пицца", "Еда", 20, 3),
    ShopItem("food_steak", "🥩 Стейк", "Еда", 30, 5),
    ShopItem("food_sushi", "🍣 Суши", "Еда", 40, 7),
    # Новые продукты
    ShopItem("food_sandwich", "🥪 Бутерброд", "Еда", 8, 1),
    ShopItem("food_cookie", "🍪 Печенье", "Еда", 9, 1),
    ShopItem("food_donut", "🍩 Пончик", "Еда", 11, 2),
    ShopItem("food_burger", "🍔 Бургер", "Еда", 22, 3),
    ShopItem("food_ramen", "🍜 Рамен", "Еда", 28, 4),
    ShopItem("food_berry", "🍓 Ягоды", "Еда", 7, 1),
    ShopItem("food_grape", "🍇 Виноград", "Еда", 10, 1),
    ShopItem("food_pineapple", "🍍 Ананас", "Еда", 16, 2),
    ShopItem("food_lobster", "🦞 Омар", "Еда", 60, 9),
    ShopItem("food_truffle", "🍄 Трюфель", "Еда", 80, 12),

    # ===== Напитки =====
    ShopItem("drink_tea", "🍵 Чай", "Напитки", 8, 1),
    ShopItem("drink_juice", "🧃 Сок", "Напитки", 10, 1),
    ShopItem("drink_milk", "🥛 Молоко", "Напитки", 9, 1),
    ShopItem("drink_cocoa", "🍫 Какао", "Напитки", 14, 2),
    ShopItem("drink_smoothie", "🥤 Смузи", "Напитки", 18, 3),
    ShopItem("drink_coconut", "🥥 Кокосовый напиток", "Напитки", 22, 4),
    ShopItem("drink_potion_energy", "⚡ Энерго-напиток", "Напитки", 35, 5),

    # ===== Лекарства =====
    ShopItem("medicine_bandage", "🩹 Бинт", "Лекарства", 10, 1),
    ShopItem("medicine_syringe", "💉 Укол", "Лекарства", 18, 2),
    ShopItem("medicine_potion", "🧪 Зелье", "Лекарства", 25, 2),
    ShopItem("medicine_elixir", "⚗️ Эликсир", "Лекарства", 50, 5),
    # Новые лекарства
    ShopItem("medicine_vitamin", "💊 Витамины", "Лекарства", 14, 1),
    ShopItem("medicine_herb", "🌿 Лечебная трава", "Лекарства", 20, 2),
    ShopItem("medicine_crystal_vial", "💎 Кристальный флакон", "Лекарства", 75, 8),
    ShopItem("medicine_phoenix_tear", "🔥 Слеза феникса", "Лекарства", 120, 12),

    # ===== Гигиена =====
    ShopItem("wash_soap", "🧼 Мыло", "Гигиена", 8, 1),
    ShopItem("wash_sponge", "🧽 Мочалка", "Гигиена", 10, 1),
    ShopItem("wash_toothbrush", "🪥 Зубная щётка", "Гигиена", 12, 1),
    ShopItem("wash_shampoo", "🧴 Шампунь", "Гигиена", 15, 2),
    ShopItem("wash_spa", "🛁 СПА-набор", "Гигиена", 35, 4),
    # Новые
    ShopItem("wash_perfume", "🌸 Духи", "Гигиена", 28, 3),
    ShopItem("wash_bubble_bath", "🫧 Пена для ванны", "Гигиена", 20, 2),
    ShopItem("wash_premium_spa", "✨ Премиум-СПА", "Гигиена", 65, 7),

    # ===== Игрушки =====
    ShopItem("toy_ball", "⚽ Мяч", "Игрушки", 12, 1),
    ShopItem("toy_frisbee", "🥏 Фрисби", "Игрушки", 18, 2),
    ShopItem("toy_puzzle", "🧩 Головоломка", "Игрушки", 25, 3),
    ShopItem("toy_guitar", "🎸 Гитара", "Игрушки", 30, 3),
    ShopItem("toy_accordion", "🪗 Гармонь", "Игрушки", 35, 4),
    ShopItem("toy_saxophone", "🎷 Саксофон", "Игрушки", 40, 5),
    ShopItem("toy_drum", "🥁 Барабан", "Игрушки", 28, 3),
    ShopItem("toy_bicycle", "🚲 Велосипед", "Игрушки", 50, 6),
    # Новые игрушки
    ShopItem("toy_kite", "🪁 Воздушный змей", "Игрушки", 22, 2),
    ShopItem("toy_telescope", "🔭 Телескоп", "Игрушки", 45, 5),
    ShopItem("toy_chemistry_set", "🧫 Химический набор", "Игрушки", 55, 6),
    ShopItem("toy_robot", "🤖 Робот-игрушка", "Игрушки", 70, 8),
    ShopItem("toy_magic_wand", "🪄 Волшебная палочка", "Игрушки", 60, 7),
    ShopItem("toy_paintbrush", "🎨 Набор красок", "Игрушки", 34, 3),
    ShopItem("toy_skateboard", "🛹 Скейтборд", "Игрушки", 48, 5),

    # ===== Украшения =====
    ShopItem("decor_star_halo", "⭐ Звёздный венок", "Украшения", 35, 1),
    ShopItem("decor_moon_tiara", "🌙 Лунная тиара", "Украшения", 65, 4),
    ShopItem("horn_glow_amber", "✨ Янтарное сияние", "Эффекты рога", 50, 3),
    ShopItem("horn_glow_aurora", "🌈 Аврора-свечение", "Эффекты рога", 90, 7),
    ShopItem("acc_scarf_sky", "🧣 Небесный шарф", "Аксессуары", 45, 2),
    ShopItem("acc_boots_cloud", "👢 Облачные ботинки", "Аксессуары", 80, 8),
    # Новые украшения
    ShopItem("decor_butterfly_clip", "🦋 Клип-бабочка", "Украшения", 40, 2),
    ShopItem("decor_rainbow_wings", "🌈 Радужные крылья", "Украшения", 100, 8),
    ShopItem("decor_crown_gold", "👑 Золотая корона", "Украшения", 150, 15),
    ShopItem("acc_cape", "🦸 Плащ героя", "Аксессуары", 90, 10),
    ShopItem("acc_sunglasses", "😎 Солнечные очки", "Аксессуары", 35, 2),
    ShopItem("horn_glow_fire", "🔥 Огненное сияние", "Эффекты рога", 110, 10),

    # ===== Темы комнаты =====
    ShopItem("theme_spring_room", "🌸 Весенняя комната", "Темы комнаты", 70, 5),
    ShopItem("theme_crystal_room", "💎 Кристальная комната", "Темы комнаты", 120, 10),
    # Новые темы
    ShopItem("theme_space_room", "🚀 Космическая станция", "Темы комнаты", 130, 11),
    ShopItem("theme_ocean_room", "🌊 Подводный мир", "Темы комнаты", 100, 8),
    ShopItem("theme_forest_room", "🌲 Лесная поляна", "Темы комнаты", 80, 6),
    ShopItem("theme_volcano_room", "🌋 Вулканическое логово", "Темы комнаты", 160, 13),
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
    "food_candy": {"hunger": 12, "happiness": 8},
    "food_icecream": {"hunger": 20, "happiness": 10},
    "food_cake": {"hunger": 25, "happiness": 8},
    "food_pizza": {"hunger": 30, "happiness": 10},
    "food_steak": {"hunger": 35, "happiness": 12},
    "food_sushi": {"hunger": 40, "happiness": 15},
    # Новые продукты
    "food_sandwich": {"hunger": 16, "happiness": 4},
    "food_cookie": {"hunger": 10, "happiness": 7},
    "food_donut": {"hunger": 14, "happiness": 9},
    "food_burger": {"hunger": 28, "happiness": 10},
    "food_ramen": {"hunger": 30, "happiness": 8, "health": 2},
    "food_berry": {"hunger": 10, "happiness": 5, "health": 3},
    "food_grape": {"hunger": 12, "happiness": 5, "health": 2},
    "food_pineapple": {"hunger": 18, "happiness": 8, "health": 3},
    "food_lobster": {"hunger": 45, "happiness": 20, "health": 5},
    "food_truffle": {"hunger": 50, "happiness": 25, "intelligence": 3},

    # Напитки
    "drink_tea": {"happiness": 10, "energy": 5, "health": 2},
    "drink_juice": {"hunger": 8, "happiness": 7, "health": 3},
    "drink_milk": {"hunger": 12, "health": 8},
    "drink_cocoa": {"hunger": 10, "happiness": 12},
    "drink_smoothie": {"hunger": 15, "happiness": 10, "health": 5},
    "drink_coconut": {"hunger": 18, "happiness": 12, "health": 4},
    "drink_potion_energy": {"energy": 30, "happiness": 8},

    # Лекарства
    "medicine_bandage": {"health": 20, "energy": 5},
    "medicine_syringe": {"health": 30, "energy": 8},
    "medicine_potion": {"health": 35, "energy": 10},
    "medicine_elixir": {"health": 50, "energy": 20},
    "medicine_vitamin": {"health": 15, "energy": 10, "happiness": 3},
    "medicine_herb": {"health": 22, "energy": 8, "hygiene": 5},
    "medicine_crystal_vial": {"health": 60, "energy": 30, "happiness": 10},
    "medicine_phoenix_tear": {"health": 100, "energy": 50, "happiness": 20},

    # Гигиена
    "wash_soap": {"hygiene": 25, "happiness": 3},
    "wash_sponge": {"hygiene": 28, "happiness": 4},
    "wash_toothbrush": {"hygiene": 30, "happiness": 5, "health": 3},
    "wash_shampoo": {"hygiene": 35, "happiness": 5},
    "wash_spa": {"hygiene": 50, "happiness": 10, "health": 5},
    "wash_perfume": {"hygiene": 20, "happiness": 12},
    "wash_bubble_bath": {"hygiene": 32, "happiness": 8, "energy": 5},
    "wash_premium_spa": {"hygiene": 70, "happiness": 20, "health": 10, "energy": 10},

    # Игрушки
    "toy_ball": {"happiness": 18, "energy": -8},
    "toy_frisbee": {"happiness": 22, "energy": -10},
    "toy_puzzle": {"happiness": 25, "energy": -5, "intelligence": 1},
    "toy_guitar": {"happiness": 28, "energy": -12, "intelligence": 2},
    "toy_accordion": {"happiness": 30, "energy": -10, "intelligence": 2},
    "toy_saxophone": {"happiness": 32, "energy": -15, "intelligence": 3},
    "toy_drum": {"happiness": 26, "energy": -14},
    "toy_bicycle": {"happiness": 35, "energy": -20, "health": 5},
    "toy_kite": {"happiness": 24, "energy": -10},
    "toy_telescope": {"happiness": 28, "energy": -8, "intelligence": 3},
    "toy_chemistry_set": {"happiness": 30, "energy": -10, "intelligence": 4},
    "toy_robot": {"happiness": 35, "energy": -12, "intelligence": 5},
    "toy_magic_wand": {"happiness": 38, "energy": -10, "intelligence": 4},
    "toy_paintbrush": {"happiness": 28, "energy": -8, "intelligence": 3},
    "toy_skateboard": {"happiness": 32, "energy": -18, "health": 3},
}


def get_item_category(item_key: str) -> str:
    """Определить категорию предмета"""
    if item_key.startswith("food_"):
        return "food"
    elif item_key.startswith("drink_"):
        return "drink"
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
    return category in ["food", "drink", "medicine", "wash", "toy"]
