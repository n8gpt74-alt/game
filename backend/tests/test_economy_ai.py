from app.services.economy import apply_progress, опыт_до_следующего_уровня
from app.services.pet_ai import определить_состояние_питомца


def test_level_formula_grows() -> None:
    assert опыт_до_следующего_уровня(1) == 50
    assert опыт_до_следующего_уровня(2) > опыт_до_следующего_уровня(1)
    assert опыт_до_следующего_уровня(10) > опыт_до_следующего_уровня(5)


def test_intelligence_multiplier_increases_xp() -> None:
    low = apply_progress(
        xp=0,
        level=1,
        stage="baby",
        intelligence=0,
        base_xp=10,
        base_coins=2,
    )[5]
    high = apply_progress(
        xp=0,
        level=1,
        stage="baby",
        intelligence=50,
        base_xp=10,
        base_coins=2,
    )[5]
    assert high.xp_gained > low.xp_gained


def test_pet_state_priority() -> None:
    assert (
        определить_состояние_питомца(hunger=20, hygiene=80, happiness=90, health=90, energy=90)
        == "Голодный"
    )
    assert (
        определить_состояние_питомца(hunger=90, hygiene=90, happiness=90, health=90, energy=15)
        == "Уставший"
    )
    assert (
        определить_состояние_питомца(hunger=90, hygiene=90, happiness=88, health=90, energy=90)
        == "Радостный"
    )
