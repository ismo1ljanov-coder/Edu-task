import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { escapeHtml } from '../utils/telegram';

// ---------------------------------------------------------------------------
// @sozdon_bot: salomlashish, imkoniyatlar, mini app tugmasi.
// Server ishga tushganda webhook, buyruqlar, menyu tugmasi va tavsif o'zi sozlanadi.
// ---------------------------------------------------------------------------

type InlineButton = { text: string; url?: string; web_app?: { url: string } };

async function tg(method: string, payload: Record<string, unknown>) {
  if (!env.telegram.botToken) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await r.json()) as { ok: boolean; description?: string };
    if (!body.ok) console.warn(`[bot] ${method}: ${body.description}`);
    return body;
  } catch (e) {
    console.warn(`[bot] ${method} xato:`, (e as Error).message);
    return null;
  }
}

/** Webhook so'rovlarini tekshirish uchun maxfiy kalit (tokendan hosil qilinadi). */
export function webhookSecret() {
  return crypto
    .createHash('sha256')
    .update(`webhook:${env.telegram.botToken ?? ''}`)
    .digest('hex')
    .slice(0, 48);
}

const appUrl = (invite?: string) =>
  invite ? `${env.clientUrl}/?invite=${encodeURIComponent(invite)}` : env.clientUrl;

const openAppButton = (invite?: string): InlineButton => ({
  text: "📱 EduTask'ni ochish",
  web_app: { url: appUrl(invite) },
});

const contactLine = () => {
  const u = env.telegram.superAdminUsernames[0];
  return u ? `\n\nMarkazingizni ulamoqchimisiz? @${u} ga yozing.` : '';
};

const CAPABILITIES: Record<Role | 'GUEST', string> = {
  GUEST:
    "Qisqasi, men ustoz bilan o'quvchi o'rtasidagi ko'prikman 🌉\n\n" +
    "Ustoz uyga so'z beradi — siz ularni Sozdon'da o'yin qilib yodlaysiz. " +
    "Daftar yo'q, zerikish yo'q 😄 Natijangiz esa o'zi ustozga yetib boradi.\n\n" +
    "Boshlash juda oson: ustozingiz yoki markazingiz bergan havolani bosing — bo'ldi, ro'yxatdan o'tish shart emas.",
  STUDENT:
    "Sizni bu yerda ko'rganimdan xursandman! 🙌\n\n" +
    "Ustoz vazifa berishi bilan shu yerga xabar qilaman. Siz esa so'zlarni o'yin qilib yodlaysiz — " +
    "har bir to'g'ri javob ball, natija esa darhol ustozga boradi. 🏆\n\n" +
    "Vazifalaringizni ko'rish uchun pastdagi tugmani bosing 👇",
  TEACHER:
    "Ustoz, xush kelibsiz! 👨‍🏫\n\n" +
    "Endi daftar tekshirish va Telegram guruhda «kim qildi, kim qilmadi» deb qidirish shart emas.\n\n" +
    "• Guruh oching va o'quvchilarga bitta havola yuboring\n" +
    "• So'zlarni yozing yoki PDF/Word faylni yuklang\n" +
    "• Kim bajardi, kim necha ball oldi — hammasini bir joyda ko'rasiz\n\n" +
    "O'quvchi vazifani tugatishi bilan sizga shu yerda yozaman 😉",
  BRANCH_ADMIN:
    "Xush kelibsiz! 🏫 Markazingizni birga boshqaramiz.\n\n" +
    "Ustozlarga bitta havola yuborasiz — ular o'zlari qo'shiladi, guruh ochadi va o'quvchilarni chaqiradi. " +
    "Siz esa butun markaz bo'yicha kim qanday ishlayotganini kuzatib turasiz.",
  SUPER_ADMIN:
    "Salom, boshliq! 😎\n\n" +
    "Yangi markaz qo'shing, adminiga havola yuboring — qolganini ular o'zlari qiladi. " +
    "Barcha markazlar statistikasi esa ilovada sizni kutyapti.",
};

const ROLE_NAME: Record<Role, string> = {
  STUDENT: "o'quvchimiz",
  TEACHER: 'ustozimiz',
  BRANCH_ADMIN: 'markaz adminimiz',
  SUPER_ADMIN: 'super adminimiz',
};

/** Toshkent vaqti bo'yicha salomlashuv */
function greeting() {
  const h = (new Date().getUTCHours() + 5) % 24;
  if (h >= 5 && h < 11) return 'Xayrli tong';
  if (h >= 11 && h < 18) return 'Assalomu alaykum';
  if (h >= 18 && h < 23) return 'Xayrli kech';
  return 'Assalomu alaykum';
}

async function reply(chatId: number, text: string, buttons: InlineButton[][]) {
  await tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: buttons },
  });
}

interface TgMessage {
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string; username?: string };
  text?: string;
}

export async function handleUpdate(update: { message?: TgMessage }) {
  const msg = update.message;
  if (!msg?.text || msg.chat.type !== 'private' || !msg.from) return;

  const text = msg.text.trim();
  const [command, payload] = text.split(/\s+/, 2);
  const firstName = escapeHtml(msg.from.first_name || 'do‘st');
  const user = await prisma.user.findUnique({
    where: { telegramId: String(msg.from.id) },
    include: { branch: { select: { name: true } } },
  });
  const role: Role | 'GUEST' = user?.role ?? 'GUEST';

  if (command === '/start') {
    const invite = payload && /^[A-Za-z0-9]{6,20}$/.test(payload) ? payload : undefined;
    const who = user
      ? `Siz bizning ${ROLE_NAME[user.role]}siz${user.branch ? ` — ${escapeHtml(user.branch.name)}` : ''}. 😊`
      : "Men <b>EduTask</b> — o'quv markazlari uchun uy vazifasi yordamchisiman.";
    const intro =
      `${greeting()}, ${firstName}! 👋\n${who}\n\n` +
      (invite ? "Sizni taklif qilishibdi! 🎉 Pastdagi tugmani bosing — darhol qo'shilasiz.\n\n" : '') +
      CAPABILITIES[role] +
      (user ? '' : contactLine());
    await reply(msg.chat.id, intro, [[openAppButton(invite)]]);
    return;
  }

  if (command === '/help' || command === '/imkoniyatlar') {
    await reply(msg.chat.id, CAPABILITIES[role] + (user ? '' : contactLine()), [[openAppButton()]]);
    return;
  }

  if (command === '/app') {
    await reply(msg.chat.id, "Marhamat, ilova tayyor 👇", [[openAppButton()]]);
    return;
  }

  // Erkin matn — do'stona javob
  const lower = text.toLowerCase();
  let answer: string;
  if (/^(salom|assalom|asalom|hi|hello|privet)/.test(lower)) {
    answer = `Va alaykum assalom, ${firstName}! 😊 Qanday yordam bera olay?`;
  } else if (/(rahmat|raxmat|spasibo|thanks)/.test(lower)) {
    answer = "Arzimaydi! 🤗 Yana nimadir kerak bo'lsa, shu yerdaman.";
  } else {
    answer =
      "Hozircha suhbatni yaxshi tushunolmayman 😅, lekin shu buyruqlar bilan doim yordam beraman:\n\n" +
      "/start — tanishish\n/help — nimalar qila olaman\n/app — ilovani ochish";
  }
  await reply(msg.chat.id, answer, [[openAppButton()]]);
}

export async function setupBot() {
  if (!env.telegram.botToken) {
    console.warn('[bot] TELEGRAM_BOT_TOKEN yo\'q — bot sozlanmadi');
    return;
  }
  const base = (process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
  if (base) {
    await tg('setWebhook', {
      url: `${base}/api/telegram/webhook`,
      secret_token: webhookSecret(),
      allowed_updates: ['message'],
      drop_pending_updates: false,
    });
  }
  await tg('setMyCommands', {
    commands: [
      { command: 'start', description: 'Boshlash' },
      { command: 'help', description: 'Imkoniyatlar' },
      { command: 'app', description: 'EduTask ilovasini ochish' },
    ],
  });
  await tg('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Ochish', web_app: { url: env.clientUrl } },
  });
  await tg('setMyShortDescription', {
    short_description: "O'quv markazlari uchun uy vazifalari: ustoz beradi, o'quvchi o'ynab yodlaydi.",
  });
  await tg('setMyDescription', {
    description:
      "Assalomu alaykum! 👋 Men EduTask — ustoz va o'quvchilarning yordamchisiman.\n\n" +
      "Ustoz uyga so'z beradi, o'quvchi ularni o'yin qilib yodlaydi, natija esa o'zi ustozga yetib boradi. " +
      "Daftar ham, chalkashlik ham yo'q 😊\n\n«Start» ni bosing — tanishib olamiz!",
  });
  console.log('[bot] sozlandi', base ? `(webhook: ${base}/api/telegram/webhook)` : '(webhook URL yo\'q)');
}
