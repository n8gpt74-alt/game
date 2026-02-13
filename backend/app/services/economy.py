from dataclasses import dataclass
import math


@dataclass
class ProgressResult:
    xp_gained: int
    coins_gained: int
    intelligence_gained: int
    crystals_gained: int
    levels_gained: list[int]
    stage_changed: bool
    previous_stage: str
    new_stage: str


def опыт_до_следующего_уровня(level: int) -> int:
    return int(math.ceil(50 * (level**1.4)))


def stage_by_level(level: int) -> str:
    if level <= 5:
        return "baby"
    if level <= 10:
        return "child"
    if level <= 20:
        return "teen"
    return "adult"


def stage_title(stage: str) -> str:
    mapping = {
        "baby": "Малыш",
        "child": "Ребёнок",
        "teen": "Подросток",
        "adult": "Взрослый",
    }
    return mapping.get(stage, "Малыш")


def xp_multiplier(intelligence: int) -> float:
    return 1.0 + (max(0, intelligence) / 100.0)


def apply_progress(
    *,
    xp: int,
    level: int,
    stage: str,
    intelligence: int,
    base_xp: int,
    base_coins: int,
    base_intelligence: int = 0,
    base_crystals: int = 0,
) -> tuple[int, int, str, int, int, ProgressResult]:
    gained_xp = int(round(base_xp * xp_multiplier(intelligence)))
    gained_coins = max(0, base_coins)
    gained_intelligence = max(0, base_intelligence)
    gained_crystals = max(0, base_crystals)

    next_xp = max(0, xp + gained_xp)
    next_level = max(1, level)
    levels_gained: list[int] = []
    carry = next_xp

    while carry >= опыт_до_следующего_уровня(next_level):
        carry -= опыт_до_следующего_уровня(next_level)
        next_level += 1
        levels_gained.append(next_level)

    previous_stage = stage
    new_stage = stage_by_level(next_level)
    changed = previous_stage != new_stage

    return (
        carry,
        next_level,
        new_stage,
        gained_coins,
        gained_intelligence,
        ProgressResult(
            xp_gained=gained_xp,
            coins_gained=gained_coins,
            intelligence_gained=gained_intelligence,
            crystals_gained=gained_crystals,
            levels_gained=levels_gained,
            stage_changed=changed,
            previous_stage=previous_stage,
            new_stage=new_stage,
        ),
    )
