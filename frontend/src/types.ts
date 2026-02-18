export type СтадияПитомца = "baby" | "child" | "teen" | "adult";

export type ТипДействия = "feed" | "wash" | "play" | "heal" | "chat" | "sleep" | "clean";

export type СостояниеAI =
  | "Спокойный"
  | "Радостный"
  | "Голодный"
  | "Уставший"
  | "Грязный"
  | "Больной"
  | "Игривый"
  | "Любопытный"
  | "Грустный";

export interface СостояниеПитомца {
  user_id: number;
  name: string;
  stage: СтадияПитомца;
  stage_title: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  coins: number;
  intelligence: number;
  crystals: number;
  hunger: number;
  hygiene: number;
  happiness: number;
  health: number;
  energy: number;
  behavior_state: СостояниеAI | string;
  is_lonely: boolean;
  last_tick_at: string;
}

export interface ЗаписьСобытия {
  id: number;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Награда {
  xp: number;
  coins: number;
  intelligence: number;
  crystals: number;
  level_up: boolean;
  levels: number[];
  stage_changed: boolean;
  stage_before: string;
  stage_after: string;
  unlocks: string[];
}

export interface ЗаданиеДня {
  task_key: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
}

export interface СостояниеЗаданий {
  tasks: ЗаданиеДня[];
  login_bonus_claimed: boolean;
  chest_claimed: boolean;
  all_completed: boolean;
}

export interface ОтветДействия {
  state: СостояниеПитомца;
  event: ЗаписьСобытия;
  reward: Награда;
  daily: СостояниеЗаданий;
  notifications: string[];
}

export type ТипМиниИгры =
  | "count_2_4"
  | "sum_4_6"
  | "compare"
  | "fast_count_6_8"
  | "sub_1_5"
  | "sequence_next"
  | "shape_count"
  | "word_problem_lite"
  | "ru_letter_sound_pick"
  | "ru_first_letter_word"
  | "ru_vowel_consonant"
  | "ru_missing_letter";

export type КатегорияМиниИгры = "math" | "letters" | "3d";

export interface ЗапросРезультатаМиниИгры {
  game_type: ТипМиниИгры;
  score: number;
  elapsed_ms: number;
  source?: "math" | "3d";
}

export interface ОтветМиниИгры {
  state: СостояниеПитомца;
  event: ЗаписьСобытия;
  reward: Награда;
  daily: СостояниеЗаданий;
  notifications: string[];
}

export interface ТоварМагазина {
  item_key: string;
  title: string;
  section: string;
  base_price: number;
  price: number;
  level_required: number;
  owned: boolean;
}

export interface КаталогМагазина {
  items: ТоварМагазина[];
}

export interface ОтветПокупки {
  state: СостояниеПитомца;
  event: ЗаписьСобытия;
  item_key: string;
  price: number;
}

export interface ПредметИнвентаря {
  item_key: string;
  quantity: number;
}


export interface СостояниеСерии {
  current: number;
  best: number;
  last_claim_date?: string | null;
}

export interface СостояниеСобытия {
  event_key: string;
  title: string;
  description: string;
  target_points: number;
  progress_points: number;
  reward_coins: number;
  reward_xp: number;
  started_at: string;
  ends_at: string;
  completed: boolean;
  claimed: boolean;
}

export interface СостояниеДостижения {
  achievement_key: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward_coins: number;
  reward_xp: number;
  completed: boolean;
  claimed: boolean;
}
