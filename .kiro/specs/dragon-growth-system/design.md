# Design Document: Dragon Growth System

## Overview

The Dragon Growth System transforms the tamagotchi game into a living, evolving companion experience. The system consists of four interconnected subsystems:

1. **Character System**: Manages five personality parameters that develop based on player actions
2. **Evolution System**: Handles progression through seven life stages with visual transformations
3. **Mood System**: Tracks and displays seven emotional states that affect gameplay
4. **Life Events System**: Generates random events that create dynamic storytelling

These systems work together to create a unique dragon personality that responds to player care, grows through distinct life stages, expresses emotions visually, and experiences life events that make each playthrough unique.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Dragon Growth System                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Character   │  │  Evolution   │  │     Mood     │      │
│  │   System     │  │   System     │  │   System     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Life Events   │                        │
│                    │    System      │                        │
│                    └────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
         ┌──────▼─────┐ ┌──▼────┐ ┌───▼──────┐
         │  Database  │ │  API  │ │ Frontend │
         └────────────┘ └───────┘ └──────────┘
```

### Data Flow

1. **Player Action** → Character System updates personality parameters
2. **Time/Level Progress** → Evolution System checks for stage advancement
3. **Stats Change** → Mood System recalculates emotional state
4. **Hourly Check** → Life Events System generates random events
5. **All Systems** → Update database and notify frontend


## Components and Interfaces

### Backend Components

#### 1. Character System (`character_system.py`)

**Purpose**: Manages five personality parameters and their gameplay effects.

**Core Functions**:
```python
def initialize_character(pet: PetState) -> None:
    """Initialize all character parameters to 50"""

def update_character_from_action(pet: PetState, action: str) -> dict[str, int]:
    """Update character parameters based on action, return deltas"""

def get_character_modifiers(pet: PetState) -> CharacterModifiers:
    """Calculate all gameplay modifiers from character"""

def get_character_stats(pet: PetState) -> CharacterStats:
    """Return current character parameter values"""
```

**Data Structures**:
```python
@dataclass
class CharacterStats:
    courage: int  # 0-100
    friendliness: int  # 0-100
    energy: int  # 0-100
    curiosity: int  # 0-100
    tidiness: int  # 0-100

@dataclass
class CharacterModifiers:
    xp_multiplier: float  # 1.0 to 1.2
    happiness_decay_multiplier: float  # 0.7 to 1.0
    illness_chance_multiplier: float  # 0.5 to 1.0
    recovery_multiplier: float  # 1.0 to 1.15
    animation_frequency_multiplier: float  # 1.0 to 1.5
    item_find_chance: float  # 0.0 to 0.05
    cleanliness_decay_multiplier: float  # 0.6 to 1.0
```

**Action to Character Mapping**:
- Mini-games → Courage +2
- Feed, Chat → Friendliness +2
- Play → Energy +2
- Chat, Explore → Curiosity +2
- Wash → Tidiness +3

#### 2. Evolution System (`evolution_system.py`)

**Purpose**: Manages seven life stages and visual transformations.

**Core Functions**:
```python
def check_evolution(pet: PetState, current_time: datetime) -> EvolutionResult:
    """Check if dragon should evolve, return result with animation trigger"""

def get_stage_info(stage: str) -> StageInfo:
    """Get visual and gameplay info for a stage"""

def get_next_stage_requirements(pet: PetState) -> StageRequirements:
    """Return requirements for next evolution"""

def trigger_evolution_animation(pet: PetState, new_stage: str) -> None:
    """Trigger evolution animation and notification"""
```

**Data Structures**:
```python
@dataclass
class StageInfo:
    stage: str
    scale: float
    min_age_days: int
    max_age_days: int
    min_level: int
    max_level: int
    visual_effects: dict[str, Any]  # color tints, textures, etc.

@dataclass
class EvolutionResult:
    evolved: bool
    old_stage: str
    new_stage: str
    animation_trigger: bool
    unlocked_abilities: list[str]

@dataclass
class StageRequirements:
    current_stage: str
    next_stage: str
    age_required: int
    level_required: int
    age_progress: float  # 0.0 to 1.0
    level_progress: float  # 0.0 to 1.0
```

**Stage Definitions**:
```python
STAGES = {
    "egg": StageInfo("egg", 0.5, 0, 0, 0, 0, {}),
    "newborn": StageInfo("newborn", 0.7, 0, 1, 1, 2, {}),
    "baby": StageInfo("baby", 1.0, 1, 3, 3, 5, {}),
    "child": StageInfo("child", 1.3, 4, 7, 6, 10, {}),
    "teen": StageInfo("teen", 1.6, 8, 14, 11, 15, {}),
    "adult": StageInfo("adult", 2.0, 15, 30, 16, 25, {}),
    "elder": StageInfo("elder", 2.2, 31, 999, 26, 999, {"gray_hair": True}),
}
```


#### 3. Mood System (`mood_system.py`)

**Purpose**: Tracks emotional states and their gameplay effects.

**Core Functions**:
```python
def calculate_mood(pet: PetState, current_time: datetime) -> MoodState:
    """Calculate current mood based on stats and time"""

def get_mood_modifiers(mood: str) -> MoodModifiers:
    """Get gameplay modifiers for a mood"""

def get_mood_visual_data(mood: str) -> MoodVisuals:
    """Get emoji and aura color for mood"""

def should_update_mood(last_update: datetime, current_time: datetime) -> bool:
    """Check if 30 seconds have passed since last update"""
```

**Data Structures**:
```python
@dataclass
class MoodState:
    mood: str  # happy, normal, sad, angry, sleepy, sick, excited
    emoji: str
    aura_color: str
    timestamp: datetime

@dataclass
class MoodModifiers:
    xp_multiplier: float  # 0.75 to 1.5
    can_play_games: bool
    animation_speed: float  # 0.5 to 1.5

@dataclass
class MoodVisuals:
    emoji: str
    aura_color: str  # hex color
    animation_set: str  # which animations to use
```

**Mood Calculation Logic**:
```python
def calculate_mood(pet: PetState, current_time: datetime) -> MoodState:
    # Priority order (first match wins)
    if pet.health < 30:
        return MoodState("sick", "🤢", "#8B4513", current_time)
    
    if pet.hunger < 20:
        return MoodState("angry", "😠", "#FF4444", current_time)
    
    hour = current_time.hour
    if hour >= 22 or hour < 6:
        return MoodState("sleepy", "😴", "#4A5568", current_time)
    
    # Check if recently played (within 5 minutes)
    if was_recently_played(pet, current_time, minutes=5):
        return MoodState("excited", "🎉", "#FFD700", current_time)
    
    # Check overall stats
    avg_stats = (pet.hunger + pet.hygiene + pet.happiness + pet.health + pet.energy) / 5
    
    if avg_stats > 70:
        return MoodState("happy", "😊", "#4ADE80", current_time)
    elif avg_stats < 40:
        return MoodState("sad", "😢", "#60A5FA", current_time)
    else:
        return MoodState("normal", "😐", "#94A3B8", current_time)
```

#### 4. Life Events System (`life_events_system.py`)

**Purpose**: Generates and manages random life events.

**Core Functions**:
```python
def check_for_events(pet: PetState, current_time: datetime) -> list[LifeEvent]:
    """Check if any events should trigger, return list of events"""

def apply_event_effects(pet: PetState, event: LifeEvent) -> EventResult:
    """Apply event effects to pet stats, return result"""

def get_event_history(pet: PetState, limit: int = 50) -> list[LifeEvent]:
    """Get recent event history"""

def should_check_events(last_check: datetime, current_time: datetime) -> bool:
    """Check if an hour has passed since last check"""
```

**Data Structures**:
```python
@dataclass
class LifeEvent:
    event_type: str  # birthday, found_item, gift, cold, nightmare, parasites, etc.
    category: str  # positive, negative, neutral
    emoji: str
    title: str
    description: str
    stat_changes: dict[str, int]
    coin_reward: int
    item_reward: str | None
    timestamp: datetime

@dataclass
class EventResult:
    event: LifeEvent
    applied: bool
    notification_message: str
    stat_deltas: dict[str, int]

@dataclass
class EventProbabilities:
    positive_chance: float = 0.30
    negative_chance: float = 0.15
    neutral_chance: float = 0.10
```

**Event Definitions**:
```python
POSITIVE_EVENTS = [
    {
        "type": "birthday",
        "trigger": lambda pet, time: pet.age_days % 7 == 0,
        "emoji": "🎂",
        "title": "День рождения!",
        "description": "Ваш дракон празднует еще одну неделю жизни!",
        "effects": {"coins": 500},
    },
    {
        "type": "found_item",
        "trigger": lambda pet, time: pet.character_curiosity > 70 and random() < 0.05,
        "emoji": "🌟",
        "title": "Находка!",
        "description": "Дракон нашел что-то блестящее!",
        "effects": {"coins": lambda: randint(50, 200)},
    },
    {
        "type": "gift",
        "trigger": lambda pet, time: random() < 0.03,
        "emoji": "🎁",
        "title": "Подарок!",
        "description": "Дракон получил подарок!",
        "effects": {"item": lambda: choice(SHOP_ITEMS)},
    },
]

NEGATIVE_EVENTS = [
    {
        "type": "cold",
        "trigger": lambda pet, time: pet.health < 50 and random() < 0.15,
        "emoji": "🤧",
        "title": "Простуда",
        "description": "Дракон простудился!",
        "effects": {"health": -20},
    },
    {
        "type": "nightmare",
        "trigger": lambda pet, time: 22 <= time.hour or time.hour < 6 and random() < 0.10,
        "emoji": "😰",
        "title": "Кошмар",
        "description": "Дракону приснился плохой сон",
        "effects": {"happiness": -15},
    },
    {
        "type": "parasites",
        "trigger": lambda pet, time: pet.hygiene < 30 and random() < 0.15,
        "emoji": "🐛",
        "title": "Паразиты",
        "description": "Дракон подхватил паразитов!",
        "effects": {"health": -10, "hygiene": -20},
    },
]

NEUTRAL_EVENTS = [
    {
        "type": "full_moon",
        "trigger": lambda pet, time: random() < 0.10,
        "emoji": "🌙",
        "title": "Полнолуние",
        "description": "Дракон светится в лунном свете",
        "effects": {},  # Visual effect only
    },
    {
        "type": "rainbow",
        "trigger": lambda pet, time: random() < 0.10,
        "emoji": "🌈",
        "title": "Радуга",
        "description": "Красивая радуга появилась на небе!",
        "effects": {"happiness": 10},
    },
    {
        "type": "shooting_star",
        "trigger": lambda pet, time: 22 <= time.hour or time.hour < 6 and random() < 0.10,
        "emoji": "⭐",
        "title": "Падающая звезда",
        "description": "Дракон загадал желание!",
        "effects": {"coins": 50},
    },
]
```


### Database Schema Extensions

**PetState Model Extensions**:
```python
class PetState(Base):
    # ... existing fields ...
    
    # Character System
    character_courage: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    character_friendliness: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    character_energy: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    character_curiosity: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    character_tidiness: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    
    # Mood System
    current_mood: Mapped[str] = mapped_column(String(16), default="normal", nullable=False)
    last_mood_update: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    
    # Age System
    birth_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    age_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Events System
    last_event_check: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    event_history: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
```

**Event History JSON Structure**:
```json
{
  "events": [
    {
      "type": "birthday",
      "category": "positive",
      "emoji": "🎂",
      "title": "День рождения!",
      "description": "Ваш дракон празднует еще одну неделю жизни!",
      "timestamp": "2024-01-15T10:30:00Z",
      "stat_changes": {},
      "coin_reward": 500,
      "item_reward": null
    }
  ],
  "total_count": 1
}
```

### API Endpoints

#### Character Endpoints

**GET /pet/character**
```python
Response: CharacterStatsResponse
{
    "courage": 65,
    "friendliness": 72,
    "energy": 58,
    "curiosity": 80,
    "tidiness": 55,
    "modifiers": {
        "xp_multiplier": 1.0,
        "happiness_decay_multiplier": 0.7,
        "illness_chance_multiplier": 0.5,
        "recovery_multiplier": 1.0,
        "animation_frequency_multiplier": 1.0,
        "item_find_chance": 0.05,
        "cleanliness_decay_multiplier": 1.0
    }
}
```

#### Mood Endpoints

**GET /pet/mood**
```python
Response: MoodResponse
{
    "mood": "happy",
    "emoji": "😊",
    "aura_color": "#4ADE80",
    "timestamp": "2024-01-15T10:30:00Z",
    "modifiers": {
        "xp_multiplier": 1.5,
        "can_play_games": true,
        "animation_speed": 1.2
    }
}
```

#### Age Endpoints

**GET /pet/age**
```python
Response: AgeResponse
{
    "age_days": 5,
    "birth_date": "2024-01-10T08:00:00Z",
    "age_display": "5 дней"
}
```

#### Evolution Endpoints

**GET /pet/evolution**
```python
Response: EvolutionResponse
{
    "current_stage": "child",
    "scale": 1.3,
    "next_stage": "teen",
    "requirements": {
        "age_required": 8,
        "level_required": 11,
        "age_progress": 0.625,  # 5/8
        "level_progress": 0.545  # 6/11
    }
}
```

#### Events Endpoints

**GET /pet/events**
```python
Query Parameters:
- limit: int = 50 (max 100)

Response: EventHistoryResponse
{
    "events": [
        {
            "type": "birthday",
            "category": "positive",
            "emoji": "🎂",
            "title": "День рождения!",
            "description": "Ваш дракон празднует еще одну неделю жизни!",
            "timestamp": "2024-01-15T10:30:00Z",
            "stat_changes": {},
            "coin_reward": 500,
            "item_reward": null
        }
    ],
    "total_count": 1
}
```

#### Updated Action Endpoint

**POST /pet/action/{action_name}**
```python
Response: ActionResponse (extended)
{
    // ... existing fields ...
    "character_deltas": {
        "courage": 0,
        "friendliness": 2,
        "energy": 0,
        "curiosity": 0,
        "tidiness": 0
    },
    "mood_changed": true,
    "new_mood": "happy",
    "evolution_occurred": false,
    "triggered_events": []
}
```


### Frontend Components

#### 1. CharacterPanel Component

**Purpose**: Display five personality parameters with visual bars.

**Props**:
```typescript
interface CharacterPanelProps {
  character: CharacterStats;
  modifiers: CharacterModifiers;
}
```

**UI Structure**:
```
┌─────────────────────────────────┐
│      Характер дракона           │
├─────────────────────────────────┤
│ 🦁 Смелость      [████████░░] 65│
│ 💖 Дружелюбие    [█████████░] 72│
│ ⚡ Энергичность  [██████░░░░] 58│
│ 🔍 Любопытство   [██████████] 80│
│ ✨ Аккуратность  [██████░░░░] 55│
└─────────────────────────────────┘
```

#### 2. MoodIndicator Component

**Purpose**: Display emoji above dragon's head and aura effect.

**Props**:
```typescript
interface MoodIndicatorProps {
  mood: MoodState;
  position: { x: number; y: number; z: number };
}
```

**Implementation**:
- Sprite element positioned above dragon
- CSS animation for floating effect
- Aura implemented as colored glow shader or CSS box-shadow
- Auto-hide after 3 seconds, show on mood change

#### 3. AgeDisplay Component

**Purpose**: Show dragon age in profile.

**Props**:
```typescript
interface AgeDisplayProps {
  ageDays: number;
  birthDate: string;
}
```

**UI**:
```
Возраст: 5 дней
Родился: 10 января 2024
```

#### 4. EventNotification Component

**Purpose**: Show popup notifications for life events.

**Props**:
```typescript
interface EventNotificationProps {
  event: LifeEvent;
  onDismiss: () => void;
}
```

**UI Structure**:
```
┌─────────────────────────────────┐
│ 🎂 День рождения!               │
│ Ваш дракон празднует еще одну   │
│ неделю жизни!                   │
│                                 │
│ +500 монет                      │
└─────────────────────────────────┘
```

**Behavior**:
- Slide in from top
- Auto-dismiss after 5 seconds
- Manual dismiss on click
- Queue multiple notifications

#### 5. EventHistory Component

**Purpose**: Display log of past events.

**Props**:
```typescript
interface EventHistoryProps {
  events: LifeEvent[];
  onLoadMore: () => void;
}
```

**UI Structure**:
```
┌─────────────────────────────────┐
│      История событий            │
├─────────────────────────────────┤
│ 🎂 День рождения!               │
│    15 января, 10:30             │
│    +500 монет                   │
├─────────────────────────────────┤
│ 🌟 Находка!                     │
│    14 января, 15:20             │
│    +150 монет                   │
├─────────────────────────────────┤
│ 😰 Кошмар                       │
│    14 января, 02:15             │
│    -15 счастья                  │
└─────────────────────────────────┘
```

#### 6. Dragon3D Component Updates

**Purpose**: Render dragon with stage-appropriate scale and visual effects.

**New Props**:
```typescript
interface Dragon3DProps {
  // ... existing props ...
  stage: string;
  mood: MoodState;
  character: CharacterStats;
}
```

**Visual Updates**:
- Scale based on stage (0.5 to 2.2)
- Aura color based on mood
- Animation speed based on mood
- Color tint based on dominant character trait
- Gray hair texture for elder stage

**Animation Sets by Mood**:
```typescript
const MOOD_ANIMATIONS = {
  happy: ["jump", "spin", "wave"],
  normal: ["idle", "look_around"],
  sad: ["sit", "slow_idle"],
  angry: ["stomp", "growl"],
  sleepy: ["yawn", "drowsy"],
  sick: ["weak_idle", "cough"],
  excited: ["jump", "spin", "dance"],
};
```


## Data Models

### TypeScript Types

```typescript
// Character System
interface CharacterStats {
  courage: number;  // 0-100
  friendliness: number;  // 0-100
  energy: number;  // 0-100
  curiosity: number;  // 0-100
  tidiness: number;  // 0-100
}

interface CharacterModifiers {
  xp_multiplier: number;
  happiness_decay_multiplier: number;
  illness_chance_multiplier: number;
  recovery_multiplier: number;
  animation_frequency_multiplier: number;
  item_find_chance: number;
  cleanliness_decay_multiplier: number;
}

// Evolution System
type LifeStage = "egg" | "newborn" | "baby" | "child" | "teen" | "adult" | "elder";

interface StageInfo {
  stage: LifeStage;
  scale: number;
  min_age_days: number;
  max_age_days: number;
  min_level: number;
  max_level: number;
  visual_effects: Record<string, any>;
}

interface EvolutionProgress {
  current_stage: LifeStage;
  next_stage: LifeStage | null;
  age_required: number;
  level_required: number;
  age_progress: number;  // 0.0 to 1.0
  level_progress: number;  // 0.0 to 1.0
}

// Mood System
type MoodType = "happy" | "normal" | "sad" | "angry" | "sleepy" | "sick" | "excited";

interface MoodState {
  mood: MoodType;
  emoji: string;
  aura_color: string;
  timestamp: string;
}

interface MoodModifiers {
  xp_multiplier: number;
  can_play_games: boolean;
  animation_speed: number;
}

// Life Events System
type EventCategory = "positive" | "negative" | "neutral";

interface LifeEvent {
  type: string;
  category: EventCategory;
  emoji: string;
  title: string;
  description: string;
  timestamp: string;
  stat_changes: Record<string, number>;
  coin_reward: number;
  item_reward: string | null;
}

interface EventHistory {
  events: LifeEvent[];
  total_count: number;
}

// Age System
interface AgeInfo {
  age_days: number;
  birth_date: string;
  age_display: string;
}

// Extended Pet State
interface PetState {
  // ... existing fields ...
  
  // Character
  character: CharacterStats;
  character_modifiers: CharacterModifiers;
  
  // Mood
  mood: MoodState;
  mood_modifiers: MoodModifiers;
  
  // Evolution
  stage: LifeStage;
  evolution_progress: EvolutionProgress;
  
  // Age
  age: AgeInfo;
  
  // Events
  recent_events: LifeEvent[];
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- Requirements 1.5-1.9 (specific action mappings) are examples of the general property 1.4
- Requirements 2.1-2.7 (individual character modifiers) can be combined into one comprehensive property
- Requirements 3.3-3.9 (stage transitions) can be combined into one property about evolution thresholds
- Requirements 4.1-4.7 (stage scales) are examples that can be tested together
- Requirements 5.2-5.8 (mood calculation rules) can be combined into one property about mood priority
- Requirements 6.1-6.9 (mood effects) can be combined into one property about mood modifiers
- Requirements 9.6-9.16 (event effects) can be combined into one property about event application
- Requirements 11.5-11.8 (load operations) are the inverse of 11.1-11.4, forming round-trip properties

### Core Properties

#### Property 1: Character Parameter Bounds

*For any* character parameter and any sequence of actions, all character parameter values should remain between 0 and 100 inclusive.

**Validates: Requirements 1.3**

#### Property 2: Character Persistence Round-Trip

*For any* valid character state, saving to database then loading should produce equivalent character parameter values.

**Validates: Requirements 1.10, 11.5**

#### Property 3: Character Modifiers Consistency

*For any* character parameter values, the calculated modifiers should match the expected values based on the parameter thresholds (e.g., courage > 70 gives 1.2x XP multiplier, friendliness > 70 gives 0.7x happiness decay).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

#### Property 4: Character Modifiers Reactivity

*For any* character state, when any character parameter changes, the modifiers should be recalculated to reflect the new parameter values.

**Validates: Requirements 2.8**

#### Property 5: Evolution Stage Thresholds

*For any* dragon with a given age and level, the evolution stage should match the correct stage based on the age/level thresholds defined in the stage table.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

#### Property 6: Evolution Persistence Round-Trip

*For any* valid life stage, saving to database then loading should produce the same life stage value.

**Validates: Requirements 3.13, 11.6**

#### Property 7: Evolution Notifications

*For any* dragon that evolves from one stage to another, a notification should be generated with the old and new stage information.

**Validates: Requirements 3.11**

#### Property 8: Evolution Ability Unlocks

*For any* dragon that evolves to a new stage, the abilities list should be updated to include abilities appropriate for that stage.

**Validates: Requirements 3.12**

#### Property 9: Mood Calculation Priority

*For any* dragon state and time, the mood should be calculated according to the priority order: sick (health < 30) > angry (hunger < 20) > sleepy (22:00-6:00) > excited (recently played) > happy (avg > 70) > sad (avg < 40) > normal.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

#### Property 10: Mood Persistence Round-Trip

*For any* valid mood state, saving to database then loading should produce the same mood value.

**Validates: Requirements 5.10, 11.7**

#### Property 11: Mood Modifiers Consistency

*For any* mood state, the calculated modifiers should match the expected values for that mood (e.g., happy gives 1.5x XP, angry prevents games, sad gives 0.75x XP).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9**

#### Property 12: Mood Modifiers Reactivity

*For any* dragon state, when the mood changes, the XP modifiers should be recalculated to reflect the new mood.

**Validates: Requirements 6.10**

#### Property 13: Age Calculation

*For any* birth date and current time, the calculated age in days should equal the floor of the time difference in days.

**Validates: Requirements 8.2**

#### Property 14: Age Persistence Round-Trip

*For any* valid birth date, saving to database then loading should produce the same birth date value.

**Validates: Requirements 8.6, 11.8**

#### Property 15: Birthday Event Triggering

*For any* dragon whose age in days is a multiple of 7, a birthday event should be triggered during the next event check.

**Validates: Requirements 9.5**

#### Property 16: Event Effects Application

*For any* life event with defined stat changes, applying the event should modify the dragon's stats by exactly the amounts specified in the event definition.

**Validates: Requirements 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13, 9.14, 9.15, 9.16**

#### Property 17: Event History Logging

*For any* life event that occurs, the event should be added to the event history with all required fields (type, timestamp, description, stat changes).

**Validates: Requirements 10.2, 10.3**

#### Property 18: Event History Persistence Round-Trip

*For any* valid event history, saving to database then loading should produce equivalent event data.

**Validates: Requirements 10.4**

#### Property 19: Event History Size Limit

*For any* event history with more than 50 events, only the most recent 50 events should be retained.

**Validates: Requirements 10.6**

#### Property 20: Event History Ordering

*For any* event history, the events should be ordered in reverse chronological order (newest first).

**Validates: Requirements 10.7**

#### Property 21: Data Validation on Load

*For any* loaded dragon state, all numeric values should be validated to be within acceptable ranges, and invalid values should be reset to safe defaults.

**Validates: Requirements 11.9, 11.10**


## Error Handling

### Character System Errors

**Invalid Parameter Values**:
- If a character parameter would exceed 100, clamp to 100
- If a character parameter would go below 0, clamp to 0
- Log warning if clamping occurs frequently (may indicate balance issue)

**Database Errors**:
- If character data fails to save, retry once
- If retry fails, log error and continue (don't block gameplay)
- On load, if character data is missing, initialize to defaults (all 50)

### Evolution System Errors

**Invalid Stage Transitions**:
- If calculated stage doesn't match any defined stage, default to "baby"
- Log error with age/level values for debugging
- Never allow backwards evolution (stage can only increase)

**Missing Stage Data**:
- If stage info is not found, use "baby" stage defaults
- Log error for investigation

### Mood System Errors

**Invalid Mood Calculation**:
- If mood calculation fails, default to "normal"
- Log error with current stats for debugging
- Continue gameplay without blocking

**Mood Update Failures**:
- If mood fails to save, continue with in-memory value
- Retry save on next update
- Don't block user actions

### Life Events System Errors

**Event Generation Failures**:
- If event generation throws exception, log and skip that event
- Continue checking other events
- Don't block gameplay

**Event Application Failures**:
- If applying event effects fails, rollback stat changes
- Log error with event details
- Show generic error notification to user

**Event History Errors**:
- If history fails to save, keep in-memory only
- Retry on next event
- If history is corrupted on load, reset to empty array

### API Error Responses

**400 Bad Request**:
- Invalid action name
- Invalid parameter values
- Missing required fields

**404 Not Found**:
- Pet not found for user
- Event not found in history

**500 Internal Server Error**:
- Database connection failure
- Unexpected calculation errors
- System errors

All errors should return JSON:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific action-to-character mappings (feed → friendliness +2)
- Specific stage transitions (baby at age 1-3, level 3-5)
- Specific mood calculations (health < 30 → sick)
- Edge cases (age = 0, level = 0, stats at boundaries)
- Error conditions (invalid data, missing fields)

**Property Tests**: Verify universal properties across all inputs
- Character parameters always stay in bounds (0-100)
- Round-trip persistence preserves data
- Modifiers correctly calculated from parameters
- Evolution stages match age/level thresholds
- Mood priority order is respected
- Event effects apply correctly

Together, unit tests catch concrete bugs while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library**: Use `hypothesis` for Python backend tests

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `# Feature: dragon-growth-system, Property N: [property text]`

**Example Property Test**:
```python
from hypothesis import given, strategies as st

@given(
    courage=st.integers(min_value=0, max_value=100),
    friendliness=st.integers(min_value=0, max_value=100),
    energy=st.integers(min_value=0, max_value=100),
    curiosity=st.integers(min_value=0, max_value=100),
    tidiness=st.integers(min_value=0, max_value=100),
)
@settings(max_examples=100)
def test_character_modifiers_consistency(courage, friendliness, energy, curiosity, tidiness):
    """
    Feature: dragon-growth-system, Property 3: Character Modifiers Consistency
    For any character parameter values, the calculated modifiers should match
    the expected values based on the parameter thresholds.
    """
    pet = create_test_pet(
        character_courage=courage,
        character_friendliness=friendliness,
        character_energy=energy,
        character_curiosity=curiosity,
        character_tidiness=tidiness,
    )
    
    modifiers = get_character_modifiers(pet)
    
    # Verify courage modifier
    if courage > 70:
        assert modifiers.xp_multiplier == 1.2
    else:
        assert modifiers.xp_multiplier == 1.0
    
    # Verify friendliness modifiers
    if friendliness > 70:
        assert modifiers.happiness_decay_multiplier == 0.7
        assert modifiers.illness_chance_multiplier == 0.5
    else:
        assert modifiers.happiness_decay_multiplier == 1.0
        assert modifiers.illness_chance_multiplier == 1.0
    
    # ... verify other modifiers
```

### Unit Test Coverage

**Character System**:
- Test initialization (all parameters = 50)
- Test specific action mappings
- Test parameter clamping at boundaries
- Test modifier calculation at thresholds
- Test persistence round-trip

**Evolution System**:
- Test each stage transition
- Test scale values for each stage
- Test evolution notification generation
- Test ability unlocks
- Test persistence round-trip

**Mood System**:
- Test each mood calculation rule
- Test mood priority order
- Test modifier values for each mood
- Test persistence round-trip

**Life Events System**:
- Test birthday event triggering
- Test event effect application
- Test event history logging
- Test history size limiting
- Test history ordering
- Test persistence round-trip

**Integration Tests**:
- Test action → character → mood → XP flow
- Test age → evolution → notification flow
- Test event → stats → mood flow
- Test full save/load cycle

### Frontend Testing

**Component Tests**:
- CharacterPanel renders all parameters correctly
- MoodIndicator displays correct emoji and color
- EventNotification shows and auto-dismisses
- EventHistory displays events in correct order

**Integration Tests**:
- Dragon3D scales correctly for each stage
- Mood changes trigger visual updates
- Evolution triggers animation
- Events trigger notifications

### Performance Testing

**Backend**:
- Character modifier calculation < 1ms
- Mood calculation < 1ms
- Event check < 10ms
- Full state serialization < 5ms

**Frontend**:
- Character panel render < 16ms (60fps)
- Mood indicator update < 16ms
- Event notification animation smooth
- Dragon scale transition smooth

### Test Data Generators

**Hypothesis Strategies**:
```python
# Character parameters (0-100)
character_param = st.integers(min_value=0, max_value=100)

# Life stages
life_stage = st.sampled_from(["egg", "newborn", "baby", "child", "teen", "adult", "elder"])

# Mood types
mood_type = st.sampled_from(["happy", "normal", "sad", "angry", "sleepy", "sick", "excited"])

# Age in days (0-60)
age_days = st.integers(min_value=0, max_value=60)

# Level (1-30)
level = st.integers(min_value=1, max_value=30)

# Stats (0-100)
stat_value = st.integers(min_value=0, max_value=100)

# Complete pet state
pet_state = st.builds(
    PetState,
    character_courage=character_param,
    character_friendliness=character_param,
    character_energy=character_param,
    character_curiosity=character_param,
    character_tidiness=character_param,
    stage=life_stage,
    level=level,
    hunger=stat_value,
    hygiene=stat_value,
    happiness=stat_value,
    health=stat_value,
    energy=stat_value,
)
```

