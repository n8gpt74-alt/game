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
  купитьТовар
} from "./api";
import { ActionDock } from "./components/ActionDock";
import { FxOverlay, type FxName, type FxTrigger } from "./components/FxOverlay";
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
const EQUIPPED_ITEMS_KEY = "дракончик_искра_экипировка_v1";
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

function загрузитьЭкипировку(): string[] {
  try {
    const raw = window.localStorage.getItem(EQUIPPED_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
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
  const initialSnapshot = useMemo(() => загрузитьЛокальныйСнимок(), []);
  const unicornRef = useRef<Unicorn3DHandle | null>(null);
  const stateRef = useRef<СостояниеПитомца | null>(null);
  const busyRef = useRef(false);
  const uiOverlayRef = useRef(false);
  const reloadRef = useRef<(() => Promise<void>) | null>(null);

  const [token, setToken] = useState("");
  const [state, setState] = useState<СостояниеПитомца | null>(initialSnapshot?.state ?? null);
  const [history, setHistory] = useState<ЗаписьСобытия[]>(initialSnapshot?.history ?? []);
  const [daily, setDaily] = useState<СостояниеЗаданий | null>(initialSnapshot?.daily ?? null);
  const [catalog, setCatalog] = useState<КаталогМагазина>(initialSnapshot?.catalog ?? { items: [] });
  const [inventory, setInventory] = useState<ПредметИнвентаря[]>(initialSnapshot?.inventory ?? []);
  const [equippedItems, setEquippedItems] = useState<string[]>(() => загрузитьЭкипировку());
  const [isOffline, setIsOffline] = useState<boolean>(!window.navigator.onLine);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<ТипДействия | null>(null);
  const [fxTrigger, setFxTrigger] = useState<FxTrigger | null>(null);
  const [showMiniGamePicker, setShowMiniGamePicker] = useState(false);
  const [showMathMiniGames, setShowMathMiniGames] = useState(false);
  const [panel, setPanel] = useState<Панель>("нет");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [cooldowns, setCooldowns] = useState({ washUntil: 0, miniUntil: 0 });
  const [cooldownNowMs, setCooldownNowMs] = useState(() => Date.now());

  const userIdDev = useMemo(() => import.meta.env.VITE_DEV_AUTH_USER_ID ?? "10001", []);
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
    сохранитьЛокальныйСнимок({
      state,
      history: history.slice(0, 30),
      daily,
      catalog,
      inventory,
      savedAt: new Date().toISOString()
    });
  }, [state, history, daily, catalog, inventory]);

  useEffect(() => {
    try {
      window.localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equippedItems));
    } catch {
      // Игнорируем ошибки localStorage.
    }
  }, [equippedItems]);

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

  useEffect(() => {
    if (initialSnapshot?.state) {
      показатьТост("Загружен локальный прогресс");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCooldownNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        initTelegramMiniApp(PET_TITLE);
        const initData = getTelegramInitData();
        const safeInitData = initData || `dev_user_id=${userIdDev}`;
        const jwt = await авторизацияТелеграм(safeInitData);
        if (active) {
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
      try {
        const [stateData, historyData, dailyData, catalogData, inventoryData] = await Promise.all([
          получитьСостояние(token),
          получитьИсторию(token),
          получитьЗаданияДня(token),
          получитьКаталогМагазина(token),
          получитьИнвентарь(token)
        ]);
        if (!active) return;
        setState(применитьСостояниеСервера(stateData));
        setHistory(historyData.slice(0, 20));
        setDaily(dailyData);
        setCatalog(catalogData);
        setInventory(inventoryData);
        setIsOffline(!window.navigator.onLine);
      } catch (err) {
        if (active) {
          setError(parseError(err));
          if (!window.navigator.onLine) {
            setIsOffline(true);
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
  }, [token]);

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

  const handleAction = async (action: ТипДействия) => {
    if (!token || busy) return;
    if (action === "wash" && washCooldownSec > 0) {
      показатьТост(`Мытьё доступно через ${washCooldownSec} сек`);
      return;
    }
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
              {isOffline ? " • офлайн" : ""}
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
