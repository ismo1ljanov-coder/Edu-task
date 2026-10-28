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
    "<b>Men nima qila olaman:</b>\n" +
    "📚 Ustoz uy vazifasi beradi — so'zlar ro'yxati\n" +
    "🎮 O'quvchi so'zlarni Sozdon'da o'yin orqali yodlaydi\n" +
    "📊 Natija avtomatik ustozga keladi: kim bajardi, necha ball\n" +
    "🔔 Yangi vazifa va natijalar haqida shu yerda xabar beraman\n\n" +
    "<b>Qanday boshlash:</b> ustozingiz yoki markazingiz bergan havolani bosing — ro'yxatdan o'tish shart emas.",
  STUDENT:
    "<b>Siz o'quvchisiz. Imkoniyatlaringiz:</b>\n" +
    "📚 Ustoz bergan vazifalarni ko'rish\n" +
    "🎮 So'zlarni Sozdon'da o'yin orqali yodlash\n" +
    "🏆 Natijangiz darhol ustozga boradi\n" +
    "🔔 Yangi vazifa berilganda shu yerda xabar olasiz",
  TEACHER:
    "<b>Siz ustozsiz. Imkoniyatlaringiz:</b>\n" +
    "👥 Guruh ochish va o'quvchilarni havola orqali qo'shish\n" +
    "📚 Vazifa berish — so'zlarni yozing yoki PDF/Word/Excel yuklang\n" +
    "📊 Kim bajardi, kim bajarmadi, kim necha ball oldi — bir joyda\n" +
    "🔔 O'quvchi vazifani bajarganda shu yerda xabar olasiz",
  BRANCH_ADMIN:
    "<b>Siz markaz adminisiz. Imkoniyatlaringiz:</b>\n" +
    "🧑‍🏫 Ustozlarni havola orqali qo'shish\n" +
    "👥 Guruhlar va o'quvchilarni kuzatish\n" +
    "📊 Markaz bo'yicha vazifalar statistikasi",
  SUPER_ADMIN:
    "<b>Siz super adminsiz. Imkoniyatlaringiz:</b>\n" +
    "🏫 Yangi o'quv markazlarini qo'shish\n" +
    "🔗 Markaz adminiga taklif havolasini yuborish\n" +
    "📈 Barcha markazlar statistikasi",
};

const ROLE_NAME: Record<Role, string> = {
  STUDENT: "o'quvchi",
  TEACHER: 'ustoz',
  BRANCH_ADMIN: 'markaz admini',
  SUPER_ADMIN: 'super admin',
};

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
    const who = user
      ? `Siz <b>${ROLE_NAME[user.role]}</b> sifatida ro'yxatdasiz${user.branch ? ` (${escapeHtml(user.branch.name)})` : ''}.`
      : "Men <b>EduTask</b> yordamchisiman — o'quv markazlari uchun uy vazifalari tizimi.";
    const invite = payload && /^[A-Za-z0-9]{6,20}$/.test(payload) ? payload : undefined;
    const intro =
      `Assalomu alaykum, ${firstName}! 👋\n${who}\n\n` +
      (invite ? "Taklif havolasi qabul qilindi — pastdagi tugmani bosing.\n\n" : '') +
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
    await reply(msg.chat.id, "Ilovani ochish uchun tugmani bosing 👇", [[openAppButton()]]);
    return;
  }

  await reply(
    msg.chat.id,
    "Men hozircha buyruqlar bilan ishlayman:\n/start — boshlash\n/help — imkoniyatlar\n/app — ilovani ochish",
    [[openAppButton()]],
  );
}

/** Server ishga tushganda botni sozlaydi (har safar xavfsiz qayta chaqiriladi). */
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
      "Assalomu alaykum! 👋 Men EduTask yordamchisiman.\n\n" +
      "📚 Ustoz uy vazifasi beradi\n🎮 O'quvchi so'zlarni Sozdon'da o'yin orqali yodlaydi\n" +
      "📊 Natija avtomatik ustozga keladi\n\nBoshlash uchun «Start» ni bosing.",
  });
  console.log('[bot] sozlandi', base ? `(webhook: ${base}/api/telegram/webhook)` : '(webhook URL yo\'q)');
}
