interface TelegramWebApp {
  initData?: string;
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
