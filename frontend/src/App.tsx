import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  авторизацияТелеграм,
  получитьБонусЗаВход,
  получитьЗаданияДня,
  получитьИнвентарь,
  получитьИсторию,
  получитьКаталогМагазина,
  получитьСостояние,
  открытьСундукДня,
  отправитьРезультатМиниИгры,
  купитьТовар,
  использоватьПредмет,
  выполнитьДействиеApi
} from "./api";
import { ActionDock } from "./components/ActionDock";
import { FxOverlay, type FxName, type FxTrigger } from "./components/FxOverlay";
import { ItemAnimation } from "./components/ItemAnimation";
import { ItemSelector } from "./components/ItemSelector";
import { TopStats } from "./components/TopStats";
import { Unicorn3D, type Unicorn3DHandle, type ВозрастМиниИгры } from "./components/Unicorn3D";
import { применитьСостояниеСервера, проверитьПовышениеУровня, выполнитьДействие } from "./game/контроллер";
import { естьНевзятыеНаграды, процентВыполненияЗаданий } from "./game/задания";
import { сгруппироватьКаталог } from "./game/магазин";
import { playFx } from "./game/анимации";
import { проигратьЗвук } from "./audio";
import { загрузитьЛокальныйСнимок, сохранитьЛокальныйСнимок } from "./offlineCache";
import {
  getTelegramInitData,
  getTelegramUserId,
  getTelegramViewportHeight,
  initTelegramMiniApp,
  syncTelegramViewportHeightVar
} from "./telegram";
import type {
  ОтветМиниИгры,
  ЗаписьСобытия,
  ЗапросРезультатаМиниИгры,
  КаталогМагазина,
  ПредметИнвентаря,
  СостояниеЗаданий,
  СостояниеПитомца,
  ТипДействия
} from "./types";

const MiniGamesScreen = lazy(() => import("./screens/MiniGamesScreen"));
const PET = { name: "Искра", species: "Дракончик" } as const;
const PET_TITLE = `${PET.species}  ${PET.name}`;
const EQUIPPED_ITEMS_PREFIX = "дракончик_искра_экипировка_v2:";
const LEGACY_EQUIPPED_ITEMS_KEY = "дракончик_искра_экипировка_v1";
const GUEST_STORAGE_KEY = "дракончик_искра_guest_id_v1";
const MINI_GAME_TYPE_BY_AGE: Record<ВозрастМиниИгры, ЗапросРезультатаМиниИгры["game_type"]> = {
  "2-4": "count_2_4",
  "5-6": "sum_4_6",
  "7-8": "fast_count_6_8"
};
const ACTION_COOLDOWN_MS = {
  wash: 45_000,
  mini: 60_000
} as const;

type Панель = "нет" | "задания" | "магазин";

function stageLabel(stageTitle: string | undefined): string {
  return stageTitle || "Малыш";
}

function parseError(err: unknown): string {
  if (!(err instanceof Error)) return "Произошла ошибка";
  const text = err.message || "Произошла ошибка";
  try {
    const json = JSON.parse(text) as { detail?: string };
    if (json.detail) return json.detail;
  } catch {
    return text;
  }
  return text;
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function cooldownSeconds(untilMs: number, nowMs: number): number {
  if (untilMs <= nowMs) return 0;
  return Math.ceil((untilMs - nowMs) / 1000);
}

function естьСерверноеВосстановлениеЭнергии(result: ОтветМиниИгры): boolean {
  if (result.notifications.some((row) => row.includes("Энергия восстановлена"))) return true;
  const payload = result.event.payload as Record<string, unknown>;
  return typeof payload.energy_recovered === "number";
}

function применитьЛокальноеВосстановлениеЭнергии(
  prev: СостояниеПитомца | null,
  next: СостояниеПитомца,
  score: number,
  result: ОтветМиниИгры
): СостояниеПитомца {
  if (!prev) return next;
  if (естьСерверноеВосстановлениеЭнергии(result)) return next;
  const recovery = score >= 3 ? 12 : 6;
  return { ...next, energy: clamp100(next.energy + recovery) };
}

function ключЭкипировки(storageUserId: string): string {
  return `${EQUIPPED_ITEMS_PREFIX}${storageUserId}`;
}

function загрузитьЭкипировку(storageUserId: string): string[] {
  try {
    const raw =
      window.localStorage.getItem(ключЭкипировки(storageUserId)) ??
      window.localStorage.getItem(LEGACY_EQUIPPED_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function сохранитьЭкипировку(storageUserId: string, equippedItems: string[]): void {
  try {
    window.localStorage.setItem(ключЭкипировки(storageUserId), JSON.stringify(equippedItems));
  } catch {
    // Игнорируем ошибки localStorage.
  }
}

function resolveStorageUserId(devUserId: string): string {
  const telegramUserId = getTelegramUserId();
  if (telegramUserId) {
    return `tg_${telegramUserId}`;
  }

  const normalizedDevUserId = String(devUserId).trim();
  if (normalizedDevUserId) {
    return `dev_${normalizedDevUserId}`;
  }

  try {
    const existingGuestId = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (existingGuestId) {
      return `guest_${existingGuestId}`;
    }

    const generatedGuestId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    window.localStorage.setItem(GUEST_STORAGE_KEY, generatedGuestId);
    return `guest_${generatedGuestId}`;
  } catch {
    return "guest_fallback";
  }
}

function этоКосметика(itemKey: string): boolean {
  return (
    itemKey.startsWith("decor_") ||
    itemKey.startsWith("horn_") ||
    itemKey.startsWith("acc_") ||
    itemKey.startsWith("theme_")
  );
}

function категорияКосметики(itemKey: string): "decor" | "horn" | "acc" | "theme" | "other" {
  if (itemKey.startsWith("decor_")) return "decor";
  if (itemKey.startsWith("horn_")) return "horn";
  if (itemKey.startsWith("acc_")) return "acc";
  if (itemKey.startsWith("theme_")) return "theme";
  return "other";
}

function мягкоеПредупреждение(state: СостояниеПитомца | null): string {
  if (!state) return "";
  if (state.hunger < 30) return `${PET.species} ${PET.name} проголодался`;
  if (state.energy < 20) return `${PET.species} ${PET.name} устал`;
  if (state.hygiene < 30) return `${PET.name}: пора мыться`;
  if (state.health < 40) return `${PET.name}: нужно лечение`;
  return "";
}

function названиеСобытия(action: string): string {
  const mapping: Record<string, string> = {
    feed: "Кормление",
    wash: "Мытьё",
    play: "Игра",
    heal: "Лечение",
    chat: "Общение",
    покупка: "Покупка",
    мини_игра: "Мини-игра",
    бонус_входа: "Бонус входа",
    сундук_дня: "Сундук дня",
    мягкое_уведомление: "Уведомление",
    ежедневный_отчёт: "Отчёт дня"
  };
  return mapping[action] ?? action;
}

export default function App() {
  const [storageUserId, setStorageUserId] = useState<string | null>(null);
  const [hasLocalSnapshot, setHasLocalSnapshot] = useState(false);
  const [localDataHydrated, setLocalDataHydrated] = useState(false);
  const unicornRef = useRef<Unicorn3DHandle | null>(null);
  const stateRef = useRef<СостояниеПитомца | null>(null);
  const busyRef = useRef(false);
  const uiOverlayRef = useRef(false);
  const reloadRef = useRef<(() => Promise<void>) | null>(null);

  const [token, setToken] = useState("");
  const [state, setState] = useState<СостояниеПитомца | null>(null);
  const [history, setHistory] = useState<ЗаписьСобытия[]>([]);
  const [daily, setDaily] = useState<СостояниеЗаданий | null>(null);
  const [catalog, setCatalog] = useState<КаталогМагазина>({ items: [] });
  const [inventory, setInventory] = useState<ПредметИнвентаря[]>([]);
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [needsClean, setNeedsClean] = useState(false);
  const [activeAction, setActiveAction] = useState<ТипДействия | null>(null);
  const [fxTrigger, setFxTrigger] = useState<FxTrigger | null>(null);
  const [showMiniGamePicker, setShowMiniGamePicker] = useState(false);
  const [showMathMiniGames, setShowMathMiniGames] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ТипДействия | null>(null);
  const [animatingItems, setAnimatingItems] = useState<Array<{ id: number; itemKey: string }>>([]);
  const [panel, setPanel] = useState<Панель>("нет");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [cooldowns, setCooldowns] = useState({ washUntil: 0, miniUntil: 0 });
  const [cooldownNowMs, setCooldownNowMs] = useState(() => Date.now());

  const userIdDev = useMemo(() => import.meta.env.VITE_DEV_AUTH_USER_ID ?? "10001", []);

  useEffect(() => {
    setStorageUserId(resolveStorageUserId(String(userIdDev)));
  }, [userIdDev]);

  const washCooldownSec = useMemo(
    () => cooldownSeconds(cooldowns.washUntil, cooldownNowMs),
    [cooldowns.washUntil, cooldownNowMs]
  );
  const miniCooldownSec = useMemo(
    () => cooldownSeconds(cooldowns.miniUntil, cooldownNowMs),
    [cooldowns.miniUntil, cooldownNowMs]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    uiOverlayRef.current = showMiniGamePicker || showMathMiniGames || panel !== "нет";
  }, [showMiniGamePicker, showMathMiniGames, panel]);

  useEffect(() => {
    if (!storageUserId) return;

    setLocalDataHydrated(false);
    const snapshot = загрузитьЛокальныйСнимок(storageUserId);
    const hasSnapshot = Boolean(snapshot?.state);
    setHasLocalSnapshot(hasSnapshot);

    if (snapshot) {
      setState(snapshot.state);
      setHistory(snapshot.history);
      setDaily(snapshot.daily);
      setCatalog(snapshot.catalog);
      setInventory(snapshot.inventory);
    } else {
      setState(null);
      setHistory([]);
      setDaily(null);
      setCatalog({ items: [] });
      setInventory([]);
    }

    setEquippedItems(загрузитьЭкипировку(storageUserId));

    if (hasSnapshot && snapshot) {
      const savedDate = new Date(snapshot.savedAt);
      const now = new Date();
      const minutesAgo = Math.floor((now.getTime() - savedDate.getTime()) / 60000);
      if (minutesAgo < 1) {
        setToast("Добро пожаловать! Прогресс загружен");
      } else if (minutesAgo < 60) {
        setToast(`Прогресс загружен (${minutesAgo} мин назад)`);
      } else {
        const hoursAgo = Math.floor(minutesAgo / 60);
        setToast(`Прогресс загружен (${hoursAgo}ч назад)`);
      }
      window.setTimeout(() => setToast(""), 2200);
    }

    setLocalDataHydrated(true);
  }, [storageUserId]);

  useEffect(() => {
    if (!storageUserId || !localDataHydrated) return;
    сохранитьЛокальныйСнимок(storageUserId, {
      state,
      history: history.slice(0, 30),
      daily,
      catalog,
      inventory,
      savedAt: new Date().toISOString()
    });
  }, [storageUserId, localDataHydrated, state, history, daily, catalog, inventory]);

  useEffect(() => {
    if (!storageUserId || !localDataHydrated) return;
    сохранитьЭкипировку(storageUserId, equippedItems);
  }, [storageUserId, localDataHydrated, equippedItems]);

  useEffect(() => {
    setEquippedItems((prev) =>
      prev.filter((itemKey) => {
        if (!этоКосметика(itemKey)) return false;
        return (inventory.find((item) => item.item_key === itemKey)?.quantity ?? 0) > 0;
      })
    );
  }, [inventory]);

  const pushFx = (effect: FxName) => {
    setFxTrigger({ id: Date.now() + Math.floor(Math.random() * 999), effect });
  };

  const показатьТост = (text: string) => {
    if (!text) return;
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

  const показатьОшибку = (text: string) => {
    setError(text);
  };


  useEffect(() => {
    const timer = window.setInterval(() => setCooldownNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Отслеживаем когда hunger достигает 100%
    if (state && state.hunger >= 100) {
      setNeedsClean(true);
    }
  }, [state]);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        initTelegramMiniApp(PET_TITLE);
        const initData = getTelegramInitData();
        const safeInitData = initData || `dev_user_id=${userIdDev}`;
        const jwt = await авторизацияТелеграм(safeInitData);
        if (active) {
          setStorageUserId(resolveStorageUserId(String(userIdDev)));
          setToken(jwt);
        }
      } catch (err) {
        if (active) setError(parseError(err));
      }
    };
    void bootstrap();
    return () => {
      active = false;
    };
  }, [userIdDev]);

  useEffect(() => {
    const applyViewport = () => {
      syncTelegramViewportHeightVar();
      const height = Math.round(getTelegramViewportHeight());
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };

    applyViewport();
    let timer: number | null = null;
    const onResize = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(applyViewport, 100);
    };

    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;

    const load = async () => {
      setIsSyncing(true);
      try {
        const [stateData, historyData, dailyData, catalogData, inventoryData] = await Promise.all([
          получитьСостояние(token),
          получитьИсторию(token),
          получитьЗаданияДня(token),
          получитьКаталогМагазина(token),
          получитьИнвентарь(token)
        ]);
        if (!active) return;
        
        // Применяем серверные данные
        const serverState = применитьСостояниеСервера(stateData);
        setState(serverState);
        setHistory(historyData.slice(0, 20));
        setDaily(dailyData);
        setCatalog(catalogData);
        setInventory(inventoryData);
        setIsOffline(false);
        setIsSyncing(false);
        
        // Показываем уведомление о синхронизации только при первой загрузке
        if (hasLocalSnapshot) {
          показатьТост("✓ Прогресс синхронизирован");
        }
      } catch (err) {
        setIsSyncing(false);
        if (active) {
          setError(parseError(err));
          if (!window.navigator.onLine) {
            setIsOffline(true);
            показатьТост("⚠ Работаем из сохранённых данных");
          }
        }
      }
    };

    reloadRef.current = load;
    void load();
    const timer = window.setInterval(() => {
      if (!busyRef.current) {
        void load();
      }
    }, 40000);

    return () => {
      active = false;
      window.clearInterval(timer);
      reloadRef.current = null;
    };
  }, [token, hasLocalSnapshot]);

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      setToast("Соединение восстановлено. Синхронизируем данные...");
      window.setTimeout(() => setToast(""), 1800);
      if (token && reloadRef.current && !busyRef.current) {
        void reloadRef.current();
      }
    };
    const onOffline = () => {
      setIsOffline(true);
      setToast("Нет сети. Работаем из локального кэша.");
      window.setTimeout(() => setToast(""), 2200);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: number | null = null;

    const loop = () => {
      const delay = 5000 + Math.floor(Math.random() * 5000);
      timer = window.setTimeout(async () => {
        if (cancelled) return;
        if (!busyRef.current && !uiOverlayRef.current && unicornRef.current) {
          const lonely = Boolean(stateRef.current?.is_lonely);
          if (lonely) {
            await unicornRef.current.playAction("chat");
            playFx("hornGlow", pushFx);
            показатьТост(`${PET.species} ${PET.name} скучает`);
          } else {
            const микродействия: ТипДействия[] = ["chat", "play", "wash"];
            const next = микродействия[Math.floor(Math.random() * микродействия.length)];
            await unicornRef.current.playAction(next);
          }
        }
        loop();
      }, delay);
    };

    loop();
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [token]);

  const handleSleep = async () => {
    if (!token || busy || isSleeping) return;
    
    const currentEnergy = stateRef.current?.energy ?? 0;
    if (currentEnergy >= 95) {
      показатьТост("Энергия уже полная! Не нужно спать");
      return;
    }
    
    setIsSleeping(true);
    setBusy(true);
    проигратьЗвук("действие");
    показатьТост("💤 Засыпаем...");
    
    // Анимация засыпания
    if (unicornRef.current) {
      await unicornRef.current.playAction("chat");
    }
    
    // Постепенное восстановление энергии
    const sleepInterval = setInterval(async () => {
      const current = stateRef.current;
      
      // Проверяем, достигли ли 100% энергии
      if (!current || current.energy >= 100) {
        clearInterval(sleepInterval);
        
        // Пробуждение - отправляем действие "sleep" на сервер для получения награды
        try {
          const result = await выполнитьДействиеApi(token, "sleep");
          const normalized = применитьСостояниеСервера(result.state);
          setState(normalized);
          setHistory((old) => [result.event, ...old].slice(0, 20));
          setDaily(result.daily);

          // Показываем награду
          const coins = result.reward?.coins || 0;
          const xp = result.reward?.xp || 0;
          показатьТост(`✨ Проснулись! +${coins} монет, +${xp} XP`);
          проигратьЗвук("успех");
          pushFx("sparkles");
        } catch {
          показатьТост("✨ Проснулись! Энергия восстановлена");
        }
        
        setIsSleeping(false);
        setBusy(false);
        return;
      }
      
      // Восстанавливаем энергию локально (+25 каждые 2 секунды)
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          energy: Math.min(100, prev.energy + 25)
        };
      });
    }, 2000);
  };

  const handleClean = async () => {
    if (!token || busy) return;
    
    setBusy(true);
    setNeedsClean(false);
    проигратьЗвук("действие");
    показатьТост("🧹 Убираем...");
    
    try {
      const result = await выполнитьДействиеApi(token, "clean");
      const normalized = применитьСостояниеСервера(result.state);
      setState(normalized);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      setDaily(result.daily);

      показатьТост("✨ Чисто! Сытость снизилась до 50%");
      проигратьЗвук("успех");
      pushFx("sparkles");
    } catch (err) {
      показатьОшибку(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (action: ТипДействия) => {
    if (!token || busy) return;
    if (action === "wash" && washCooldownSec > 0) {
      показатьТост(`Мытьё доступно через ${washCooldownSec} сек`);
      return;
    }
    
    // Специальная обработка для сна
    if (action === "sleep") {
      await handleSleep();
      return;
    }
    
    // Для действий feed, wash, play, heal показываем селектор предметов
    if (["feed", "wash", "play", "heal"].includes(action)) {
      setSelectedAction(action);
      setShowItemSelector(true);
      return;
    }
    
    // Для остальных действий (chat) выполняем напрямую
    await executeActionDirect(action);
  };
  
  const executeActionDirect = async (action: ТипДействия) => {
    setBusy(true);
    setActiveAction(action);
    setError("");
    проигратьЗвук("действие");

    try {
      const prev = stateRef.current;
      const { ответ } = await выполнитьДействие(action, {
        токен: token,
        питомец3d: unicornRef.current,
        emitFx: pushFx,
        текущееСостояние: prev
      });

      const normalized = применитьСостояниеСервера(ответ.state);
      const рост = проверитьПовышениеУровня(prev, normalized);

      setState(normalized);
      setHistory((old) => [ответ.event, ...old].slice(0, 20));
      setDaily(ответ.daily);
      проигратьЗвук("успех");

      for (const text of ответ.notifications) {
        показатьТост(text);
      }
      if (рост.естьПовышение) {
        pushFx("flash");
        показатьТост(`Новый уровень! ${normalized.level}`);
        проигратьЗвук("успех");
      }
      if (ответ.reward.unlocks.length > 0) {
        показатьТост(`Разблокировано: ${ответ.reward.unlocks.join(", ")}`);
      }
      if (рост.новаяСтадия) {
        проигратьЗвук("эволюция");
        await unicornRef.current?.evolveTo(normalized.stage);
      }
      if (action === "wash") {
        const next = Date.now() + ACTION_COOLDOWN_MS.wash;
        setCooldowns((prevCooldowns) => ({ ...prevCooldowns, washUntil: next }));
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setActiveAction(null);
      setBusy(false);
    }
  };
  
  const handleUseItem = async (itemKey: string) => {
    if (!token || busy) return;
    
    // Сохраняем действие локально, чтобы не потерять при следующем вызове
    const currentAction = selectedAction;
    
    setShowItemSelector(false);
    
    // Блокируем интерфейс только на время сетевого запроса
    setBusy(true);
    setActiveAction(currentAction);
    setError("");
    
    // Сразу запускаем анимацию дракончика
    if (currentAction) {
      unicornRef.current?.playAction(currentAction);
    }
    
    // Показываем анимацию предмета с уникальным ID
    const animationId = Date.now() + Math.random();
    setAnimatingItems(prev => [...prev, { id: animationId, itemKey }]);
    
    // Убираем анимацию через 1.2 секунды
    setTimeout(() => {
      setAnimatingItems(prev => prev.filter(item => item.id !== animationId));
    }, 1200);
    
    // Звук в зависимости от типа предмета
    if (itemKey.startsWith("food_")) {
      проигратьЗвук("действие");
    } else if (itemKey.startsWith("medicine_")) {
      проигратьЗвук("успех");
    } else if (itemKey.startsWith("wash_")) {
      проигратьЗвук("действие");
    } else if (itemKey.startsWith("toy_")) {
      проигратьЗвук("нажатие");
    }
    
    try {
      const prev = stateRef.current;
      const result = await использоватьПредмет(token, itemKey);
      
      const normalized = применитьСостояниеСервера(result.state);
      const рост = проверитьПовышениеУровня(prev, normalized);
      
      setState(normalized);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      setDaily(result.daily);
      
      // Обновляем инвентарь
      const inventoryData = await получитьИнвентарь(token);
      setInventory(inventoryData);
      
      // Эффекты в зависимости от действия
      if (currentAction === "feed") {
        playFx("sparkles", pushFx);
      } else if (currentAction === "wash") {
        playFx("bubbles", pushFx);
      } else if (currentAction === "play") {
        playFx("hearts", pushFx);
      } else if (currentAction === "heal") {
        playFx("hornGlow", pushFx);
      }
      
      проигратьЗвук("успех");
      
      for (const text of result.notifications) {
        показатьТост(text);
      }
      if (рост.естьПовышение) {
        pushFx("flash");
        показатьТост(`Новый уровень! ${normalized.level}`);
        проигратьЗвук("успех");
      }
      if (result.reward.unlocks.length > 0) {
        показатьТост(`Разблокировано: ${result.reward.unlocks.join(", ")}`);
      }
      if (рост.новаяСтадия) {
        проигратьЗвук("эволюция");
        await unicornRef.current?.evolveTo(normalized.stage);
      }
      if (currentAction === "wash") {
        const next = Date.now() + ACTION_COOLDOWN_MS.wash;
        setCooldowns((prevCooldowns) => ({ ...prevCooldowns, washUntil: next }));
      }
      
      // Разблокируем интерфейс
      setBusy(false);
      setActiveAction(null);
      setSelectedAction(null);
    } catch (err) {
      setError(parseError(err));
      setBusy(false);
      setActiveAction(null);
      setSelectedAction(null);
    }
  };

  const handleStartMiniGame = async (ageGroup: ВозрастМиниИгры) => {
    if (!token || busy || !unicornRef.current) return;
    if (miniCooldownSec > 0) {
      показатьТост(`Мини-игры доступны через ${miniCooldownSec} сек`);
      return;
    }
    setBusy(true);
    setError("");
    setShowMiniGamePicker(false);
    проигратьЗвук("нажатие");
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
      const miniResult = await unicornRef.current.startMiniGame(ageGroup);
      const payload: ЗапросРезультатаМиниИгры = {
        game_type: MINI_GAME_TYPE_BY_AGE[ageGroup],
        score: miniResult.score,
        elapsed_ms: 20000,
        source: "3d"
      };
      const prev = stateRef.current;
      const result = await отправитьРезультатМиниИгры(token, payload);
      const normalized = применитьСостояниеСервера(result.state);
      const рост = проверитьПовышениеУровня(prev, normalized);
      setState(normalized);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      setDaily(result.daily);
      playFx("sparkles", pushFx);
      проигратьЗвук("успех");
      показатьТост(`Мини-игра завершена: +${miniResult.xp} опыта`);
      показатьТост(`Награда: +${result.reward.xp} опыта, +${result.reward.coins} монет`);
      for (const text of result.notifications) {
        показатьТост(text);
      }
      if (рост.естьПовышение) pushFx("flash");
      if (result.reward.unlocks.length > 0) {
        показатьТост(`Разблокировано: ${result.reward.unlocks.join(", ")}`);
      }
      if (рост.новаяСтадия) {
        проигратьЗвук("эволюция");
        await unicornRef.current?.evolveTo(normalized.stage);
      }
      setCooldowns((prevCooldowns) => ({ ...prevCooldowns, miniUntil: Date.now() + ACTION_COOLDOWN_MS.mini }));
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleMathMiniGameResult = async (payload: ЗапросРезультатаМиниИгры) => {
    if (!token || busy) return;
    if (miniCooldownSec > 0) {
      показатьТост(`Мини-игры доступны через ${miniCooldownSec} сек`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const prev = stateRef.current;
      const result = await отправитьРезультатМиниИгры(token, { ...payload, source: "math" });
      const normalized = применитьСостояниеСервера(result.state);
      const withRecovery = применитьЛокальноеВосстановлениеЭнергии(prev, normalized, payload.score, result);
      const рост = проверитьПовышениеУровня(prev, withRecovery);
      setState(withRecovery);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      setDaily(result.daily);
      playFx("sparkles", pushFx);
      проигратьЗвук("успех");
      показатьТост(`Награда: +${result.reward.xp} опыта, +${result.reward.coins} монет`);
      if (!естьСерверноеВосстановлениеЭнергии(result)) {
        const recovery = payload.score >= 3 ? 12 : 6;
        показатьТост(`Энергия восстановлена: +${recovery}`);
      }
      for (const text of result.notifications) {
        показатьТост(text);
      }
      if (рост.естьПовышение) pushFx("flash");
      if (result.reward.unlocks.length > 0) {
        показатьТост(`Разблокировано: ${result.reward.unlocks.join(", ")}`);
      }
      if (рост.новаяСтадия) {
        проигратьЗвук("эволюция");
        await unicornRef.current?.evolveTo(withRecovery.stage);
      }
      setCooldowns((prevCooldowns) => ({ ...prevCooldowns, miniUntil: Date.now() + ACTION_COOLDOWN_MS.mini }));
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const claimLogin = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const result = await получитьБонусЗаВход(token);
      setState(применитьСостояниеСервера(result.state));
      setDaily(result.daily);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      for (const text of result.notifications) {
        показатьТост(text);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const claimChest = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const result = await открытьСундукДня(token);
      setState(применитьСостояниеСервера(result.state));
      setDaily(result.daily);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      playFx("flash", pushFx);
      for (const text of result.notifications) {
        показатьТост(text);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const buyItem = async (itemKey: string) => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const result = await купитьТовар(token, itemKey);
      setState(применитьСостояниеСервера(result.state));
      setHistory((old) => [result.event, ...old].slice(0, 20));
      const [catalogData, inventoryData] = await Promise.all([получитьКаталогМагазина(token), получитьИнвентарь(token)]);
      setCatalog(catalogData);
      setInventory(inventoryData);
      показатьТост("Покупка завершена");
      проигратьЗвук("покупка");
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleEquipItem = useCallback(
    (itemKey: string) => {
      if (!этоКосметика(itemKey)) return;
      const owned = (inventory.find((item) => item.item_key === itemKey)?.quantity ?? 0) > 0;
      if (!owned) return;
      проигратьЗвук("нажатие");

      setEquippedItems((prev) => {
        const exists = prev.includes(itemKey);
        if (exists) return prev.filter((key) => key !== itemKey);

        const category = категорияКосметики(itemKey);
        if (category === "theme" || category === "horn") {
          return [...prev.filter((key) => категорияКосметики(key) !== category), itemKey];
        }
        return [...prev, itemKey];
      });
    },
    [inventory]
  );

  const groupedCatalog = useMemo(() => сгруппироватьКаталог(catalog.items), [catalog]);
  const taskProgress = useMemo(() => процентВыполненияЗаданий(daily), [daily]);
  const hasDailyRewards = useMemo(() => естьНевзятыеНаграды(daily), [daily]);
  const warning = useMemo(() => мягкоеПредупреждение(state), [state]);
  const activeRoomTheme = useMemo(() => equippedItems.find((key) => key.startsWith("theme_")) ?? null, [equippedItems]);
  const inventoryMap = useMemo(() => {
    return inventory.reduce<Record<string, number>>((acc, item) => {
      acc[item.item_key] = item.quantity;
      return acc;
    }, {});
  }, [inventory]);

  return (
    <div className="app-shell">
      <div className="room-bg">
        <i className="layer sky" />
        <i className="layer wall" />
        <i className="layer floor" />
      </div>

      <main className="mobile-layout">
        <header className="top-wrap">
          <div className="pet-title">
            <strong>{PET_TITLE}</strong>
            <span>
              {stageLabel(state?.stage_title)}
              {isOffline && " • офлайн"}
              {isSyncing && " • синхронизация..."}
            </span>
          </div>

          <section className="resource-strip">
            <article className="resource-chip">
              <span>💰 Монеты</span>
              <strong>{state?.coins ?? 0}</strong>
            </article>
            <article className="resource-chip">
              <span>⭐ Опыт</span>
              <strong>
                {state?.xp ?? 0}/{state?.xp_to_next_level ?? 0}
              </strong>
            </article>
            <article className="resource-chip">
              <span>🧠 Интеллект</span>
              <strong>{state?.intelligence ?? 0}</strong>
            </article>
            <article className="resource-chip">
              <span>💎 Кристаллы</span>
              <strong>{state?.crystals ?? 0}</strong>
            </article>
            <article className="resource-chip">
              <span>🏅 Уровень</span>
              <strong>{state?.level ?? 1}</strong>
            </article>
          </section>

          <TopStats state={state} />

          <section className="meta-line">
            <div className="pet-mood">
              Состояние: {state?.behavior_state ?? "Спокойный"}  {PET.name}
            </div>
            <div className="meta-actions">
              <button type="button" className="meta-btn" onClick={() => setPanel(panel === "задания" ? "нет" : "задания")}>
                Задания {hasDailyRewards ? "•" : ""}
              </button>
              <button type="button" className="meta-btn" onClick={() => setPanel(panel === "магазин" ? "нет" : "магазин")}>
                Магазин
              </button>
            </div>
          </section>
        </header>

        <section className="scene-wrap">
          <Unicorn3D
            ref={unicornRef}
            stage={state?.stage ?? "baby"}
            className="unicorn-3d"
            activeCosmetics={equippedItems}
            roomTheme={activeRoomTheme}
          />
          <FxOverlay trigger={fxTrigger} />
          {animatingItems.map(item => (
            <ItemAnimation
              key={item.id}
              itemKey={item.itemKey}
              onComplete={() => {
                // Callback больше не нужен, таймер сам уберёт
              }}
            />
          ))}
          {needsClean && (
            <div className="poop-overlay">
              <div className="poop-icon">💩</div>
              <button 
                className="clean-button"
                onClick={handleClean}
                disabled={busy}
              >
                🧹 Убрать
              </button>
            </div>
          )}
          {isSleeping && (
            <div className="sleep-overlay">
              <div className="sleep-zzz">
                <span>Z</span>
                <span>z</span>
                <span>z</span>
              </div>
              <div className="sleep-stars">
                <span>✨</span>
                <span>⭐</span>
                <span>💫</span>
              </div>
              <div className="sleep-text">Сплю... Энергия: {state?.energy ?? 0}%</div>
            </div>
          )}
          {warning && <div className="low-stat-warning">{warning}</div>}
        </section>

        <section className="bottom-wrap">
          <ActionDock
            disabled={!token || busy}
            activeAction={activeAction}
            cooldowns={{ wash: washCooldownSec, mini: miniCooldownSec }}
            onAction={handleAction}
            onMiniGames={() => setShowMiniGamePicker(true)}
          />
        </section>
      </main>

      {panel === "задания" && (
        <div className="sheet-overlay" role="dialog" aria-modal="true">
          <div className="sheet-card">
            <header className="sheet-head">
              <h3>Задания дня</h3>
              <button type="button" onClick={() => setPanel("нет")}>
                Закрыть
              </button>
            </header>
            <p className="sheet-sub">Выполнено: {taskProgress}%</p>
            <div className="daily-list">
              {daily?.tasks.map((task) => (
                <article key={task.task_key} className="daily-item">
                  <div>
                    <strong>{task.title}</strong>
                    <span>
                      {task.progress}/{task.target}
                    </span>
                  </div>
                  <div className="daily-track">
                    <i style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }} />
                  </div>
                </article>
              ))}
            </div>
            <div className="sheet-actions">
              <button type="button" onClick={claimLogin} disabled={busy || daily?.login_bonus_claimed}>
                {daily?.login_bonus_claimed ? "Бонус получен" : "Забрать бонус входа"}
              </button>
              <button type="button" onClick={claimChest} disabled={busy || !daily?.all_completed || daily?.chest_claimed}>
                {daily?.chest_claimed ? "Сундук открыт" : "Открыть сундук дня"}
              </button>
            </div>
          </div>
        </div>
      )}

      {panel === "магазин" && (
        <div className="sheet-overlay" role="dialog" aria-modal="true">
          <div className="sheet-card">
            <header className="sheet-head">
              <h3>Магазин</h3>
              <button type="button" onClick={() => setPanel("нет")}>
                Закрыть
              </button>
            </header>
            <div className="shop-list">
              {Object.entries(groupedCatalog).map(([section, items]) => (
                <section key={section}>
                  <h4>{section}</h4>
                  {items.map((item) => (
                    <article key={item.item_key} className="shop-item">
                      <div>
                        <strong>{item.title}</strong>
                        <span>
                          Цена: {item.price} • Уровень: {item.level_required}
                        </span>
                        <span>В инвентаре: {inventoryMap[item.item_key] ?? 0}</span>
                      </div>
                      <div className="shop-item-actions">
                        <button
                          type="button"
                          disabled={busy || item.owned || (state?.level ?? 1) < item.level_required || (state?.coins ?? 0) < item.price}
                          onClick={() => buyItem(item.item_key)}
                        >
                          {item.owned ? "Куплено" : "Купить"}
                        </button>
                        {этоКосметика(item.item_key) && (
                          <button
                            type="button"
                            disabled={busy || (inventoryMap[item.item_key] ?? 0) <= 0}
                            onClick={() => toggleEquipItem(item.item_key)}
                          >
                            {equippedItems.includes(item.item_key) ? "Снять" : "Надеть"}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {showMiniGamePicker && (
        <div className="sheet-overlay" role="dialog" aria-modal="true">
          <div className="sheet-card">
            <header className="sheet-head">
              <h3>Мини-игры в 3D</h3>
              <button type="button" onClick={() => setShowMiniGamePicker(false)}>
                Закрыть
              </button>
            </header>
            <p className="sheet-sub">Режим: Поймай искру. Выберите возраст:</p>
            {miniCooldownSec > 0 && <p className="sheet-sub">Повторный запуск через {miniCooldownSec} сек</p>}
            <div className="age-picker-grid">
              <button type="button" disabled={busy || miniCooldownSec > 0} onClick={() => handleStartMiniGame("2-4")}>
                2-4 года • Лёгкий
              </button>
              <button type="button" disabled={busy || miniCooldownSec > 0} onClick={() => handleStartMiniGame("5-6")}>
                5-6 лет • Средний
              </button>
              <button type="button" disabled={busy || miniCooldownSec > 0} onClick={() => handleStartMiniGame("7-8")}>
                7-8 лет • Быстрый
              </button>
              <button
                type="button"
                disabled={busy || miniCooldownSec > 0}
                onClick={() => {
                  setShowMiniGamePicker(false);
                  setShowMathMiniGames(true);
                }}
              >
                Открыть математические игры
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemSelector && selectedAction && (
        <ItemSelector
          action={selectedAction}
          inventory={inventory}
          onSelect={handleUseItem}
          onCancel={() => {
            setShowItemSelector(false);
            setSelectedAction(null);
          }}
        />
      )}

      {error && <div className="toast error">{error}</div>}
      {toast && <div className="toast success">{toast}</div>}

      {showMathMiniGames && (
        <Suspense fallback={<div className="mini-loading">Загрузка мини-игр...</div>}>
          <MiniGamesScreen onClose={() => setShowMathMiniGames(false)} onSubmitResult={handleMathMiniGameResult} />
        </Suspense>
      )}

      <aside className="history-strip">
        {history.slice(0, 3).map((event) => (
          <div key={event.id} className="history-row">
            <span>{названиеСобытия(event.action)}</span>
            <time>{new Date(event.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</time>
          </div>
        ))}
      </aside>
    </div>
  );
}
