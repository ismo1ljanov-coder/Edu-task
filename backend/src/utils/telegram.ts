import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/**
 * Telegram Mini App initData imzosini tekshiradi.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSec = 24 * 60 * 60) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date') ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;

  const rawUser = params.get('user');
  if (!rawUser) return null;
  let user: TelegramUser;
  try {
    user = JSON.parse(rawUser);
  } catch {
    return null;
  }
  if (!user?.id) return null;

  return { user, startParam: params.get('start_param') ?? undefined };
}

/** Bot orqali xabar yuborish (xato bo'lsa jim o'tadi — asosiy jarayonni to'xtatmaydi). */
export async function sendTelegramMessage(
  botToken: string | undefined,
  chatId: string,
  text: string,
  button?: { text: string; url: string },
) {
  if (!botToken) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...(button ? { reply_markup: { inline_keyboard: [[{ text: button.text, url: button.url }]] } } : {}),
      }),
    });
  } catch {
    /* ignore */
  }
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
