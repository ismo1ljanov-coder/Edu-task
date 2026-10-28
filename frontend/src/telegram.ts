// Telegram Mini App yordamchilari (telegram-web-app.js index.html da yuklanadi)
interface TgWebApp {
  initData: string;
  initDataUnsafe?: { start_param?: string };
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
  requestWriteAccess?: (cb?: (ok: boolean) => void) => void;
  colorScheme?: 'light' | 'dark';
}

export function getTelegram(): TgWebApp | null {
  const tg = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
  return tg && tg.initData ? tg : null;
}

/** Havolani Telegram'da ulashish oynasini ochadi (Telegram'dan tashqarida — yangi oynada). */
export function shareLink(url: string, text: string) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const tg = getTelegram();
  if (tg?.openTelegramLink) tg.openTelegramLink(share);
  else window.open(share, '_blank', 'noopener,noreferrer');
}
