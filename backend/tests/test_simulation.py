from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from app.services.simulation import apply_action, apply_time_decay


@dataclass
class DummyPet:
    hunger: int
    hygiene: int
    happiness: int
    health: int
    energy: int
    last_tick_at: datetime
    character_courage: int = 50
    character_friendliness: int = 50
    character_energy: int = 50
    character_curiosity: int = 50
    character_tidiness: int = 50


def test_apply_time_decay_respects_cap_and_clamp() -> None:
    pet = DummyPet(
        hunger=10,
        hygiene=12,
        happiness=30,
        health=25,
        energy=8,
        last_tick_at=datetime.now(UTC) - timedelta(hours=24),
    )
    now = datetime.now(UTC)

    effective_seconds = apply_time_decay(pet, now=now, cap_seconds=3600)

    assert effective_seconds == 3600
    assert 0 <= pet.hunger <= 100
    assert 0 <= pet.hygiene <= 100
    assert 0 <= pet.happiness <= 100
    assert 0 <= pet.health <= 100
    assert 0 <= pet.energy <= 100
    assert pet.last_tick_at == now


def test_apply_time_decay_handles_future_last_tick() -> None:
    now = datetime.now(UTC)
    pet = DummyPet(
        hunger=50,
        hygiene=50,
        happiness=50,
        health=50,
        energy=50,
        last_tick_at=now + timedelta(minutes=5),
    )
    effective_seconds = apply_time_decay(pet, now=now, cap_seconds=3600)
    assert effective_seconds == 0
    assert pet.hunger == 50
    assert pet.hygiene == 50


def test_action_effects_feed() -> None:
    pet = DummyPet(50, 50, 50, 50, 50, datetime.now(UTC))
    result = apply_action(pet, "feed")
    assert result.action == "feed"
    assert pet.hunger > 50
    assert pet.hygiene < 50


def test_action_effects_play() -> None:
    pet = DummyPet(80, 80, 30, 70, 70, datetime.now(UTC))
    apply_action(pet, "play")
    assert pet.happiness > 30
    assert pet.energy < 70


def test_action_effects_heal() -> None:
    pet = DummyPet(60, 60, 60, 20, 70, datetime.now(UTC))
    apply_action(pet, "heal")
    assert pet.health > 20


def test_action_effects_chat() -> None:
    pet = DummyPet(60, 60, 20, 40, 60, datetime.now(UTC))
    apply_action(pet, "chat")
    assert pet.happiness > 20


def test_action_effects_wash() -> None:
    pet = DummyPet(60, 10, 50, 60, 60, datetime.now(UTC))
    apply_action(pet, "wash")
    assert pet.hygiene > 10
