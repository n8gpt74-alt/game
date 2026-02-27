interface TelegramWebAppUser {
  id?: number | string;
}

interface TelegramInitDataUnsafe {
  user?: TelegramWebAppUser;
}
interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: TelegramInitDataUnsafe;
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isVerticalSwipesEnabled?: boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
  isFullscreen?: boolean;
  platform?: string;
  version?: string;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  onEvent?: (eventType: string, eventHandler: () => void) => void;
  offEvent?: (eventType: string, eventHandler: () => void) => void;
}

interface TelegramObject {
  WebApp?: TelegramWebApp;
}

declare global {
  interface Window {
    Telegram?: TelegramObject;
  }
}

export function getTelegramInitData(): string {
  const app = window.Telegram?.WebApp;
  return app?.initData ?? "";
}

function parseUserIdFromInitData(initData: string): string | null {
  if (!initData) return null;
  try {
    const params = new URLSearchParams(initData);
    const rawUser = params.get("user");
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser) as { id?: number | string };
    if (typeof parsed.id === "number" || typeof parsed.id === "string") {
      const normalized = String(parsed.id).trim();
      return normalized || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getTelegramUserId(): string | null {
  const app = window.Telegram?.WebApp;
  const unsafeId = app?.initDataUnsafe?.user?.id;
  if (typeof unsafeId === "number" || typeof unsafeId === "string") {
    const normalized = String(unsafeId).trim();
    if (normalized) return normalized;
  }
  return parseUserIdFromInitData(app?.initData ?? "");
}

export function getTelegramViewportHeight(): number {
  const cssValue = getComputedStyle(document.documentElement).getPropertyValue("--tg-viewport-stable-height").trim();
  if (cssValue.endsWith("px")) {
    const parsed = Number.parseFloat(cssValue.replace("px", ""));
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return window.visualViewport?.height ?? window.innerHeight;
}

export function syncTelegramViewportHeightVar(): number {
  const app = window.Telegram?.WebApp;
  const height = app?.viewportStableHeight ?? app?.viewportHeight ?? window.visualViewport?.height ?? window.innerHeight;
  const rounded = Math.round(height);
  document.documentElement.style.setProperty("--tg-viewport-stable-height", `${rounded}px`);
  return rounded;
}

export function initTelegramMiniApp(title: string): void {
  const app = window.Telegram?.WebApp;

  // Lock body overflow to prevent bounce/scroll in Telegram WebView
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.documentElement.style.position = "fixed";
  document.documentElement.style.width = "100%";
  document.documentElement.style.height = "100%";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  document.body.style.overscrollBehavior = "none";

  // Prevent pull-to-refresh / overscroll on touch devices
  document.addEventListener("touchmove", (e) => {
    // Allow scrolling inside scrollable containers
    const target = e.target as HTMLElement | null;
    if (target?.closest?.(".sheet-card, .mini-card, .item-selector, .leaderboard-list, .shop-list, .daily-list")) {
      return;
    }
    e.preventDefault();
  }, { passive: false });

  if (!app) {
    document.title = title;
    syncTelegramViewportHeightVar();
    return;
  }
  app?.ready?.();
  app?.expand?.();
  app?.setHeaderColor?.("secondary_bg_color");
  app?.setBackgroundColor?.("bg_color");

  // Disable vertical swipes to prevent accidental close (Telegram 7.7+)
  try {
    app?.disableVerticalSwipes?.();
  } catch {
    // Method not available in older versions
  }

  // Try fullscreen for better immersion (Telegram 8.0+)
  try {
    if (!app?.isFullscreen) {
      app?.requestFullscreen?.();
    }
  } catch {
    // Fullscreen not supported
  }

  syncTelegramViewportHeightVar();
  document.title = title;

  // Listen for viewport changes (e.g., keyboard popups or expanding)
  try {
    app.onEvent("viewportChanged", () => {
      syncTelegramViewportHeightVar();
    });
  } catch (e) {
    // Ignore if not supported
    window.addEventListener("resize", syncTelegramViewportHeightVar);
  }
}

// --- HAPTIC FEEDBACK HELPERS ---

export function playHapticImpact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light"): void {
  const app = window.Telegram?.WebApp;
  app?.HapticFeedback?.impactOccurred(style);
}

export function playHapticNotification(type: "error" | "success" | "warning"): void {
  const app = window.Telegram?.WebApp;
  app?.HapticFeedback?.notificationOccurred(type);
}

export function playHapticSelection(): void {
  const app = window.Telegram?.WebApp;
  app?.HapticFeedback?.selectionChanged();
}
