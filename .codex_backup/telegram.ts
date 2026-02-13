interface TelegramWebApp {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
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

export function initTelegramMiniApp(title: string): void {
  const app = window.Telegram?.WebApp;
  if (!app) {
    document.title = title;
    return;
  }
  app?.ready?.();
  app?.expand?.();
  app?.setHeaderColor?.("secondary_bg_color");
  app?.setBackgroundColor?.("bg_color");
  document.title = title;
}
