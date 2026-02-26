import random
from app.models import PetState
from app.services.simulation import clamp

def trigger_random_event(pet: PetState, action: str, notifications: list[str]) -> None:
    # 15% chance for a random event to occur
    if random.random() > 0.15:
        return
        
    events = []
    if action == "wash":
        events = [
            ("Питомец нашёл в пене блестящую монетку! +10 монет", {"coins": 10}),
            ("Вы устроили пенную вечеринку! +10 счастья", {"happiness": 10}),
            ("Питомец так блестит, что ослепляет! +20 чистоты", {"hygiene": 20})
        ]
    elif action == "play":
        events = [
            ("Питомец нашёл забытую игрушку! +15 счастья", {"happiness": 15}),
            ("Питомец победил воображаемого монстра! +10 XP", {"xp": 10}),
            ("Мячик улетел в грязь. -10 чистоты", {"hygiene": -10})
        ]
    elif action == "feed":
        events = [
            ("Еда оказалась невероятно вкусной! +15 счастья", {"happiness": 15}),
            ("Питомец нашел золотую крошку в еде! +15 монет", {"coins": 15}),
            ("Вы перекормили питомца. -10 энергии", {"energy": -10})
        ]
    elif action == "heal":
        events = [
            ("Лекарство оказалось сладким! +10 счастья", {"happiness": 10}),
            ("Питомец мужественно перенёс укол! +5 Смелости", {"character_courage": 5})
        ]
    elif action == "chat":
        events = [
            ("Питомец рассказал вам интересную историю. +5 интеллекта", {"intelligence": 5}),
            ("Питомец выпросил у вас карманные деньги! +5 монет", {"coins": 5})
        ]

    if not events:
        return

    # Choose a random event from the list
    event = random.choice(events)
    message, effects = event
    
    # Apply effects
    for stat, amount in effects.items():
        if stat == "coins":
            pet.coins += amount
        elif stat == "xp":
            pet.xp += amount
        elif stat == "intelligence":
            pet.intelligence += amount
        else:
            # clamp properties 0-100 like happiness, hygiene, energy, character traits
            current_val = getattr(pet, stat, 50)
            setattr(pet, stat, clamp(current_val + amount))
            
    # Add to notifications
    notifications.append(message)
