from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user_id
from app.models import EventLog
from app.schemas import (
    ActionResponse,
    DailyStateOut,
    DailyTaskOut,
    EventLogOut,
    InventoryOut,
    MinigameResultRequest,
    MinigameResultResponse,
    PetStateOut,
    RewardOut,
    ShopBuyRequest,
    ShopBuyResponse,
    ShopCatalogOut,
    ShopItemOut,
)
from app.services.game import (
    buy_shop_item,
    claim_daily_chest_for_pet,
    claim_login_bonus_for_pet,
    ensure_pet_state,
    execute_action,
    execute_minigame,
    get_daily_state,
    get_inventory,
    get_shop_catalog,
    run_decay,
    serialize_pet_state,
)


router = APIRouter(tags=["game"])

DbDep = Annotated[Session, Depends(get_db)]
UserDep = Annotated[int, Depends(get_current_user_id)]


def _to_daily_out(payload: dict) -> DailyStateOut:
    tasks = [
        DailyTaskOut(
            task_key=str(task.get("task_key", "")),
            title=str(task.get("title", "")),
            target=int(task.get("target", 1)),
            progress=int(task.get("progress", 0)),
            completed=bool(task.get("completed", False)),
        )
        for task in payload.get("tasks", [])
    ]
    return DailyStateOut(
        tasks=tasks,
        login_bonus_claimed=bool(payload.get("login_bonus_claimed", False)),
        chest_claimed=bool(payload.get("chest_claimed", False)),
        all_completed=bool(payload.get("all_completed", False)),
    )


def _to_reward_out(payload) -> RewardOut:
    return RewardOut(
        xp=payload.xp,
        coins=payload.coins,
        intelligence=payload.intelligence,
        crystals=payload.crystals,
        level_up=payload.level_up,
        levels=payload.levels,
        stage_changed=payload.stage_changed,
        stage_before=payload.stage_before,
        stage_after=payload.stage_after,
        unlocks=payload.unlocks,
    )


@router.get("/state", response_model=PetStateOut)
def state(db: DbDep, user_id: UserDep) -> PetStateOut:
    pet = ensure_pet_state(db, user_id)
    run_decay(db, pet)
    db.refresh(pet)
    return PetStateOut(**serialize_pet_state(pet))


def _run_action(action_name: str, db: Session, user_id: int) -> ActionResponse:
    pet = ensure_pet_state(db, user_id)
    result = execute_action(db, pet, action_name)
    return ActionResponse(
        state=PetStateOut(**serialize_pet_state(result.pet)),
        event=EventLogOut(
            id=result.event.id,
            action=result.event.action,
            payload=result.event.payload,
            created_at=result.event.created_at,
        ),
        reward=_to_reward_out(result.reward),
        daily=_to_daily_out(result.event.payload.get("daily", {})),
        notifications=result.notifications,
    )


@router.post("/action/feed", response_model=ActionResponse)
def action_feed(db: DbDep, user_id: UserDep) -> ActionResponse:
    return _run_action("feed", db, user_id)


@router.post("/action/wash", response_model=ActionResponse)
def action_wash(db: DbDep, user_id: UserDep) -> ActionResponse:
    return _run_action("wash", db, user_id)


@router.post("/action/play", response_model=ActionResponse)
def action_play(db: DbDep, user_id: UserDep) -> ActionResponse:
    return _run_action("play", db, user_id)


@router.post("/action/heal", response_model=ActionResponse)
def action_heal(db: DbDep, user_id: UserDep) -> ActionResponse:
    return _run_action("heal", db, user_id)


@router.post("/action/chat", response_model=ActionResponse)
def action_chat(db: DbDep, user_id: UserDep) -> ActionResponse:
    return _run_action("chat", db, user_id)


@router.post("/minigames/result", response_model=MinigameResultResponse)
def minigames_result(payload: MinigameResultRequest, db: DbDep, user_id: UserDep) -> MinigameResultResponse:
    pet = ensure_pet_state(db, user_id)
    result = execute_minigame(db, pet, payload.game_type, payload.score, payload.elapsed_ms, payload.source)
    return MinigameResultResponse(
        state=PetStateOut(**serialize_pet_state(result.pet)),
        event=EventLogOut(
            id=result.event.id,
            action=result.event.action,
            payload=result.event.payload,
            created_at=result.event.created_at,
        ),
        reward=_to_reward_out(result.reward),
        daily=_to_daily_out(result.event.payload.get("daily", {})),
        notifications=result.notifications,
    )


@router.get("/daily", response_model=DailyStateOut)
def daily(db: DbDep, user_id: UserDep) -> DailyStateOut:
    return _to_daily_out(get_daily_state(db, user_id))


@router.post("/daily/claim-login", response_model=ActionResponse)
def daily_claim_login(db: DbDep, user_id: UserDep) -> ActionResponse:
    pet = ensure_pet_state(db, user_id)
    result = claim_login_bonus_for_pet(db, pet)
    if result is None:
        raise HTTPException(status_code=400, detail="Бонус уже получен")
    return ActionResponse(
        state=PetStateOut(**serialize_pet_state(result.pet)),
        event=EventLogOut(
            id=result.event.id,
            action=result.event.action,
            payload=result.event.payload,
            created_at=result.event.created_at,
        ),
        reward=_to_reward_out(result.reward),
        daily=_to_daily_out(result.daily),
        notifications=result.notifications,
    )


@router.post("/daily/claim-chest", response_model=ActionResponse)
def daily_claim_chest(db: DbDep, user_id: UserDep) -> ActionResponse:
    pet = ensure_pet_state(db, user_id)
    result = claim_daily_chest_for_pet(db, pet)
    if result is None:
        raise HTTPException(status_code=400, detail="Сундук недоступен")
    return ActionResponse(
        state=PetStateOut(**serialize_pet_state(result.pet)),
        event=EventLogOut(
            id=result.event.id,
            action=result.event.action,
            payload=result.event.payload,
            created_at=result.event.created_at,
        ),
        reward=_to_reward_out(result.reward),
        daily=_to_daily_out(result.daily),
        notifications=result.notifications,
    )


@router.get("/shop/catalog", response_model=ShopCatalogOut)
def shop_catalog(db: DbDep, user_id: UserDep) -> ShopCatalogOut:
    pet = ensure_pet_state(db, user_id)
    items = [
        ShopItemOut(
            item_key=item["item_key"],
            title=item["title"],
            section=item["section"],
            base_price=item["base_price"],
            price=item["price"],
            level_required=item["level_required"],
            owned=item["owned"],
        )
        for item in get_shop_catalog(db, pet)
    ]
    return ShopCatalogOut(items=items)


@router.post("/shop/buy", response_model=ShopBuyResponse)
def shop_buy(payload: ShopBuyRequest, db: DbDep, user_id: UserDep) -> ShopBuyResponse:
    pet = ensure_pet_state(db, user_id)
    try:
        result = buy_shop_item(db, pet, payload.item_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ShopBuyResponse(
        state=PetStateOut(**serialize_pet_state(result.pet)),
        event=EventLogOut(
            id=result.event.id,
            action=result.event.action,
            payload=result.event.payload,
            created_at=result.event.created_at,
        ),
        item_key=result.item_key,
        price=result.price,
    )


@router.get("/history", response_model=list[EventLogOut])
def history(db: DbDep, user_id: UserDep, limit: int = Query(default=30, ge=1, le=200)) -> list[EventLogOut]:
    rows = db.execute(
        select(EventLog).where(EventLog.user_id == user_id).order_by(desc(EventLog.created_at)).limit(limit)
    ).scalars()
    return [EventLogOut(id=row.id, action=row.action, payload=row.payload, created_at=row.created_at) for row in rows]


@router.get("/inventory", response_model=list[InventoryOut])
def inventory(db: DbDep, user_id: UserDep) -> list[InventoryOut]:
    rows = get_inventory(db, user_id)
    return [InventoryOut(item_key=row.item_key, quantity=row.quantity) for row in rows]
