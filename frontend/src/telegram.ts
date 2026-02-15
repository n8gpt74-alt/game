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
  if (!app) {
    document.title = title;
    syncTelegramViewportHeightVar();
    return;
  }
  app?.ready?.();
  app?.expand?.();
  app?.setHeaderColor?.("secondary_bg_color");
  app?.setBackgroundColor?.("bg_color");
  syncTelegramViewportHeightVar();
  document.title = title;
}
