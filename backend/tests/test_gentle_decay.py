"""Тесты для мягкой деградации состояния питомца"""
from datetime import UTC, datetime, timedelta
import sys
from pathlib import Path

# Добавляем путь к модулям
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.simulation import apply_time_decay


class MockPet:
    """Мок-объект питомца для тестирования"""
    def __init__(self):
        self.hunger = 80
        self.hygiene = 80
        self.happiness = 80
        self.health = 85
        self.energy = 85
        self.last_tick_at = datetime.now(UTC)


def test_gentle_decay_short_absence():
    """Тест: короткое отсутствие (2 часа) - заметная, но не критичная деградация"""
    pet = MockPet()
    now = pet.last_tick_at + timedelta(hours=2)
    
    apply_time_decay(pet, now, cap_seconds=21600, lonely=False)
    
    # После 2 часов деградация должна быть умеренной
    assert pet.hunger >= 66, f"Голод слишком низкий: {pet.hunger}"
    assert pet.energy >= 70, f"Энергия слишком низкая: {pet.energy}"
    assert pet.hygiene >= 68, f"Чистота слишком низкая: {pet.hygiene}"
    assert pet.happiness >= 74, f"Настроение слишком низкое: {pet.happiness}"
    print(f"✓ 2 часа: голод={pet.hunger}, энергия={pet.energy}, чистота={pet.hygiene}, настроение={pet.happiness}")


def test_gentle_decay_medium_absence():
    """Тест: среднее отсутствие (12 часов) - деградация ограничена cap"""
    pet = MockPet()
    now = pet.last_tick_at + timedelta(hours=12)
    
    apply_time_decay(pet, now, cap_seconds=21600, lonely=False)
    
    # После 12 часов применяется только cap (6 часов), но показатели должны оставаться играбельными
    assert pet.hunger > 40, f"Голод слишком низкий: {pet.hunger}"
    assert pet.energy > 45, f"Энергия слишком низкая: {pet.energy}"
    assert pet.hygiene > 43, f"Чистота слишком низкая: {pet.hygiene}"
    assert pet.happiness > 35, f"Настроение слишком низкое: {pet.happiness}"
    print(f"✓ 12 часов: голод={pet.hunger}, энергия={pet.energy}, чистота={pet.hygiene}, настроение={pet.happiness}")


def test_gentle_decay_long_absence():
    """Тест: долгое отсутствие (48 часов) - деградация ограничивается cap"""
    pet = MockPet()
    now = pet.last_tick_at + timedelta(hours=48)
    
    apply_time_decay(pet, now, cap_seconds=21600, lonely=False)
    
    # После 48 часов деградация ограничена cap (6 часов)
    assert pet.hunger > 40, f"Голод слишком низкий: {pet.hunger}"
    assert pet.energy > 40, f"Энергия слишком низкая: {pet.energy}"
    assert pet.hygiene > 40, f"Чистота слишком низкая: {pet.hygiene}"
    assert pet.health > 65, f"Здоровье не должно сильно падать: {pet.health}"
    print(f"✓ 48 часов: голод={pet.hunger}, энергия={pet.energy}, чистота={pet.hygiene}, здоровье={pet.health}")


def test_gentle_decay_with_loneliness():
    """Тест: отсутствие с одиночеством (>24ч)"""
    pet = MockPet()
    now = pet.last_tick_at + timedelta(hours=30)
    
    apply_time_decay(pet, now, cap_seconds=21600, lonely=True)
    
    # С одиночеством настроение падает быстрее, но не должно обнуляться
    assert pet.happiness > 20, f"Настроение слишком низкое даже с одиночеством: {pet.happiness}"
    assert pet.hunger > 40, f"Голод слишком низкий: {pet.hunger}"
    print(f"✓ 30 часов (одиночество): настроение={pet.happiness}, голод={pet.hunger}")


def test_no_health_drop_without_critical_stats():
    """Тест: здоровье не падает без критических значений"""
    pet = MockPet()
    pet.hunger = 60  # Выше порога деградации здоровья (45)
    pet.hygiene = 60  # Выше порога деградации здоровья (40)
    now = pet.last_tick_at + timedelta(hours=2)  # Короткий период
    
    initial_health = pet.health
    apply_time_decay(pet, now, cap_seconds=21600, lonely=False)
    
    # Здоровье не должно падать при некритических значениях
    assert pet.health == initial_health, f"Здоровье упало без критических значений: было {initial_health}, стало {pet.health}, голод={pet.hunger}, чистота={pet.hygiene}"
    print(f"✓ Здоровье стабильно: {pet.health} (голод={pet.hunger}, чистота={pet.hygiene})")


if __name__ == "__main__":
    print("Запуск тестов мягкой деградации...\n")
    test_gentle_decay_short_absence()
    test_gentle_decay_medium_absence()
    test_gentle_decay_long_absence()
    test_gentle_decay_with_loneliness()
    test_no_health_drop_without_critical_stats()
    print("\n✅ Все тесты пройдены!")
