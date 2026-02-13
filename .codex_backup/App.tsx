import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
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
import { Unicorn3D, type Unicorn3DHandle } from "./components/Unicorn3D";
import { применитьСостояниеСервера, проверитьПовышениеУровня, выполнитьДействие } from "./game/контроллер";
import { естьНевзятыеНаграды, процентВыполненияЗаданий } from "./game/задания";
import { сгруппироватьКаталог } from "./game/магазин";
import { playFx } from "./game/анимации";
import { getTelegramInitData, initTelegramMiniApp } from "./telegram";
import type {
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
const PET_TITLE = `${PET.species} — ${PET.name}`;

type Панель = "нет" | "задания" | "магазин";

function ждать(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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

function мягкоеПредупреждение(state: СостояниеПитомца | null): string {
  if (!state) return "";
  if (state.hunger < 30) return `${PET.species} ${PET.name} проголодался`;
  if (state.energy < 20) return `${PET.species} ${PET.name} устал`;
  if (state.hygiene < 30) return `${PET.species}у ${PET.name} нужна ванна`;
  if (state.health < 40) return `${PET.species}у ${PET.name} нужно лечение`;
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
  const unicornRef = useRef<Unicorn3DHandle | null>(null);
  const stateRef = useRef<СостояниеПитомца | null>(null);
  const busyRef = useRef(false);
  const uiOverlayRef = useRef(false);

  const [token, setToken] = useState("");
  const [state, setState] = useState<СостояниеПитомца | null>(null);
  const [history, setHistory] = useState<ЗаписьСобытия[]>([]);
  const [daily, setDaily] = useState<СостояниеЗаданий | null>(null);
  const [catalog, setCatalog] = useState<КаталогМагазина>({ items: [] });
  const [inventory, setInventory] = useState<ПредметИнвентаря[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<ТипДействия | null>(null);
  const [fxTrigger, setFxTrigger] = useState<FxTrigger | null>(null);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [panel, setPanel] = useState<Панель>("нет");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const userIdDev = useMemo(() => import.meta.env.VITE_DEV_AUTH_USER_ID ?? "10001", []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    uiOverlayRef.current = showMiniGames || panel !== "нет";
  }, [showMiniGames, panel]);

  const pushFx = (effect: FxName) => {
    setFxTrigger({ id: Date.now() + Math.floor(Math.random() * 999), effect });
  };

  const показатьТост = (text: string) => {
    if (!text) return;
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

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
      } catch (err) {
        if (active) setError(parseError(err));
      }
    };

    void load();
    const timer = window.setInterval(() => {
      if (!busyRef.current) {
        void load();
      }
    }, 40000);

    return () => {
      active = false;
      window.clearInterval(timer);
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
    setBusy(true);
    setActiveAction(action);
    setError("");

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

      for (const text of ответ.notifications) {
        показатьТост(text);
      }
      if (рост.естьПовышение) {
        pushFx("flash");
        показатьТост(`Новый уровень! ${normalized.level}`);
      }
      if (ответ.reward.unlocks.length > 0) {
        показатьТост(`Разблокировано: ${ответ.reward.unlocks.join(", ")}`);
      }
      if (рост.новаяСтадия) {
        await unicornRef.current?.evolveTo(normalized.stage);
      }
    } catch (err) {
      setError(parseError(err));
    } finally {
      setActiveAction(null);
      setBusy(false);
    }
  };

  const handleMiniGameResult = async (payload: ЗапросРезультатаМиниИгры) => {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      const prev = stateRef.current;
      const result = await отправитьРезультатМиниИгры(token, payload);
      const normalized = применитьСостояниеСервера(result.state);
      const рост = проверитьПовышениеУровня(prev, normalized);
      setState(normalized);
      setHistory((old) => [result.event, ...old].slice(0, 20));
      setDaily(result.daily);
      playFx("sparkles", pushFx);
      показатьТост(`Награда: +${result.reward.xp} опыта, +${result.reward.coins} монет`);
      if (рост.естьПовышение) pushFx("flash");
      if (result.reward.unlocks.length > 0) {
        показатьТост(`Разблокировано: ${result.reward.unlocks.join(", ")}`);
      }
      if (рост.новаяСтадия) await unicornRef.current?.evolveTo(normalized.stage);
      await ждать(120);
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
    } catch (err) {
      setError(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const groupedCatalog = useMemo(() => сгруппироватьКаталог(catalog.items), [catalog]);
  const taskProgress = useMemo(() => процентВыполненияЗаданий(daily), [daily]);
  const hasDailyRewards = useMemo(() => естьНевзятыеНаграды(daily), [daily]);
  const warning = useMemo(() => мягкоеПредупреждение(state), [state]);
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
            <span>{stageLabel(state?.stage_title)}</span>
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
              Состояние: {state?.behavior_state ?? "Спокойный"} — {PET.name}
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
          <Unicorn3D ref={unicornRef} stage={state?.stage ?? "baby"} className="unicorn-3d" />
          <FxOverlay trigger={fxTrigger} />
          {warning && <div className="low-stat-warning">{warning}</div>}
        </section>

        <section className="bottom-wrap">
          <ActionDock
            disabled={!token || busy}
            activeAction={activeAction}
            onAction={handleAction}
            onMiniGames={() => setShowMiniGames(true)}
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
                      <button
                        type="button"
                        disabled={busy || item.owned || (state?.level ?? 1) < item.level_required || (state?.coins ?? 0) < item.price}
                        onClick={() => buyItem(item.item_key)}
                      >
                        {item.owned ? "Куплено" : "Купить"}
                      </button>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <div className="toast error">{error}</div>}
      {toast && <div className="toast success">{toast}</div>}

      {showMiniGames && (
        <Suspense fallback={<div className="mini-loading">Загрузка мини-игр...</div>}>
          <MiniGamesScreen onClose={() => setShowMiniGames(false)} onSubmitResult={handleMiniGameResult} />
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
