from dataclasses import dataclass


@dataclass
class ShopItem:
    item_key: str
    title: str
    section: str
    base_price: int
    level_required: int


CATALOG: list[ShopItem] = [
    ShopItem("decor_star_halo", "Звёздный венок", "Украшения", 35, 1),
    ShopItem("decor_moon_tiara", "Лунная тиара", "Украшения", 65, 4),
    ShopItem("horn_glow_amber", "Янтарное сияние", "Эффекты рога", 50, 3),
    ShopItem("horn_glow_aurora", "Аврора-свечение", "Эффекты рога", 90, 7),
    ShopItem("theme_spring_room", "Весенняя комната", "Темы комнаты", 70, 5),
    ShopItem("theme_crystal_room", "Кристальная комната", "Темы комнаты", 120, 10),
    ShopItem("acc_scarf_sky", "Небесный шарф", "Аксессуары", 45, 2),
    ShopItem("acc_boots_cloud", "Облачные ботинки", "Аксессуары", 80, 8),
]


def price_for_level(base_price: int, level: int) -> int:
    level_factor = 1.8 ** max(1, level)
    return int(round(base_price * level_factor))


def find_item(item_key: str) -> ShopItem | None:
    for item in CATALOG:
        if item.item_key == item_key:
            return item
    return None
