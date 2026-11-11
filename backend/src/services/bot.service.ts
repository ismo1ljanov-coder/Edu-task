import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { escapeHtml } from '../utils/telegram';

// ---------------------------------------------------------------------------
// @sozdon_bot: salomlashish, imkoniyatlar, mini app tugmasi.
// Server ishga tushganda webhook, buyruqlar, menyu tugmasi va tavsif o'zi sozlanadi.
// ---------------------------------------------------------------------------

type InlineButton = { text: string; url?: string; web_app?: { url: string }; callback_data?: string };

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

// ---------------------------------------------------------------------------
// Tillar: foydalanuvchining Telegram tili (language_code) bo'yicha javob beriladi.
// uz — asosiy; ru, en, ar — tarjimalar. Boshqa tillar uchun o'zbekcha.
// ---------------------------------------------------------------------------
type Lang = 'uz' | 'ru' | 'en' | 'ar';

function langOf(code?: string): Lang {
  const c = (code || '').toLowerCase();
  if (c.startsWith('ru')) return 'ru';
  if (c.startsWith('en')) return 'en';
  if (c.startsWith('ar')) return 'ar';
  return 'uz';
}

interface Strings {
  openApp: string;
  contact: (u: string) => string;
  capabilities: Record<Role | 'GUEST', string>;
  roleLine: (role: Role, branch: string) => string;
  guestLine: string;
  greet: { morning: string; day: string; evening: string; night: string };
  invited: string;
  appReady: string;
  hello: (name: string) => string;
  thanks: string;
  fallback: string;
  loginAsk: string;
  loginConfirm: string;
  loginConfirmed: string;
  loginConfirmedText: string;
  backToSozdon: string;
  requestExpired: string;
  friend: string;
}

const ROLE_NAMES: Record<Lang, Record<Role, string>> = {
  uz: { STUDENT: "o'quvchimiz", TEACHER: 'ustozimiz', BRANCH_ADMIN: 'markaz adminimiz', SUPER_ADMIN: 'super adminimiz' },
  ru: { STUDENT: 'наш ученик', TEACHER: 'наш преподаватель', BRANCH_ADMIN: 'администратор центра', SUPER_ADMIN: 'супер-админ' },
  en: { STUDENT: 'one of our students', TEACHER: 'one of our teachers', BRANCH_ADMIN: 'a center admin', SUPER_ADMIN: 'the super admin' },
  ar: { STUDENT: 'أحد طلابنا', TEACHER: 'أحد معلمينا', BRANCH_ADMIN: 'مسؤول المركز', SUPER_ADMIN: 'المشرف العام' },
};

const STR: Record<Lang, Strings> = {
  uz: {
    openApp: "📱 EduTask'ni ochish",
    contact: (u) => `\n\nMarkazingizni ulamoqchimisiz? @${u} ga yozing.`,
    capabilities: {
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
    },
    roleLine: (role, branch) => `Siz bizning ${ROLE_NAMES.uz[role]}siz${branch ? ` — ${branch}` : ''}. 😊`,
    guestLine: "Men <b>EduTask</b> — o'quv markazlari uchun uy vazifasi yordamchisiman.",
    greet: { morning: 'Xayrli tong', day: 'Assalomu alaykum', evening: 'Xayrli kech', night: 'Assalomu alaykum' },
    invited: "Sizni taklif qilishibdi! 🎉 Pastdagi tugmani bosing — darhol qo'shilasiz.\n\n",
    appReady: 'Marhamat, ilova tayyor 👇',
    hello: (n) => `Va alaykum assalom, ${n}! 😊 Qanday yordam bera olay?`,
    thanks: "Arzimaydi! 🤗 Yana nimadir kerak bo'lsa, shu yerdaman.",
    fallback:
      "Hozircha suhbatni yaxshi tushunolmayman 😅, lekin shu buyruqlar bilan doim yordam beraman:\n\n" +
      '/start — tanishish\n/help — nimalar qila olaman\n/app — ilovani ochish',
    loginAsk:
      "<b>Sozdon.uz</b> saytiga Telegram orqali kirmoqchisiz.\n" +
      'Tasdiqlash uchun pastdagi tugmani bosing 👇\n\n' +
      "<i>Agar hozir saytda «Telegram orqali kirish» tugmasini bosmagan bo'lsangiz — tasdiqlamang.</i>",
    loginConfirm: '✅ Tasdiqlash va kirish',
    loginConfirmed: 'Tasdiqlandi ✅',
    loginConfirmedText:
      "✅ <b>Tasdiqlandi!</b>\n\nSaytga qayting — siz allaqachon kirgansiz. Agar sahifa o'zgarmagan bo'lsa, pastdagi tugmani bosing.",
    backToSozdon: "🌐 Sozdon'ga qaytish",
    requestExpired: "So'rov eskirgan",
    friend: 'do‘st',
  },
  ru: {
    openApp: '📱 Открыть EduTask',
    contact: (u) => `\n\nХотите подключить свой центр? Напишите @${u}.`,
    capabilities: {
      GUEST:
        'Если коротко, я мост между учителем и учеником 🌉\n\n' +
        'Учитель задаёт слова на дом — вы учите их в Sozdon, играя. ' +
        'Без тетрадей и скуки 😄 А результат сам приходит учителю.\n\n' +
        'Начать очень просто: нажмите ссылку от учителя или центра — и всё, регистрация не нужна.',
      STUDENT:
        'Рад видеть вас здесь! 🙌\n\n' +
        'Как только учитель задаст задание, я сообщу сюда. А вы учите слова, играя — ' +
        'каждый правильный ответ — это баллы, а результат сразу уходит учителю. 🏆\n\n' +
        'Чтобы увидеть свои задания, нажмите кнопку ниже 👇',
      TEACHER:
        'Добро пожаловать, учитель! 👨‍🏫\n\n' +
        'Больше не нужно проверять тетради и выяснять в Telegram-группе, кто сделал, а кто нет.\n\n' +
        '• Создайте группу и отправьте ученикам одну ссылку\n' +
        '• Напишите слова или загрузите файл PDF/Word\n' +
        '• Кто выполнил и сколько баллов набрал — всё видно в одном месте\n\n' +
        'Как только ученик закончит задание, я напишу вам сюда 😉',
      BRANCH_ADMIN:
        'Добро пожаловать! 🏫 Будем управлять центром вместе.\n\n' +
        'Отправьте учителям одну ссылку — они сами подключатся, создадут группы и пригласят учеников. ' +
        'А вы будете видеть, как идёт работа во всём центре.',
      SUPER_ADMIN:
        'Привет, шеф! 😎\n\n' +
        'Добавьте новый центр и отправьте ссылку его админу — остальное они сделают сами. ' +
        'Статистика всех центров ждёт вас в приложении.',
    },
    roleLine: (role, branch) => `Вы ${ROLE_NAMES.ru[role]}${branch ? ` — ${branch}` : ''}. 😊`,
    guestLine: 'Я <b>EduTask</b> — помощник по домашним заданиям для учебных центров.',
    greet: { morning: 'Доброе утро', day: 'Здравствуйте', evening: 'Добрый вечер', night: 'Здравствуйте' },
    invited: 'Вас пригласили! 🎉 Нажмите кнопку ниже — и вы сразу присоединитесь.\n\n',
    appReady: 'Пожалуйста, приложение готово 👇',
    hello: (n) => `Здравствуйте, ${n}! 😊 Чем могу помочь?`,
    thanks: 'Не за что! 🤗 Если что-то ещё понадобится — я здесь.',
    fallback:
      'Пока я плохо понимаю свободный текст 😅, но всегда помогу с этими командами:\n\n' +
      '/start — знакомство\n/help — что я умею\n/app — открыть приложение',
    loginAsk:
      'Вы хотите войти на сайт <b>Sozdon.uz</b> через Telegram.\n' +
      'Чтобы подтвердить, нажмите кнопку ниже 👇\n\n' +
      '<i>Если вы сейчас не нажимали «Войти через Telegram» на сайте — не подтверждайте.</i>',
    loginConfirm: '✅ Подтвердить и войти',
    loginConfirmed: 'Подтверждено ✅',
    loginConfirmedText:
      '✅ <b>Подтверждено!</b>\n\nВернитесь на сайт — вы уже вошли. Если страница не изменилась, нажмите кнопку ниже.',
    backToSozdon: '🌐 Вернуться в Sozdon',
    requestExpired: 'Запрос устарел',
    friend: 'друг',
  },
  en: {
    openApp: '📱 Open EduTask',
    contact: (u) => `\n\nWant to connect your learning center? Message @${u}.`,
    capabilities: {
      GUEST:
        "In short, I'm the bridge between teacher and student 🌉\n\n" +
        'Your teacher assigns words as homework — you learn them in Sozdon by playing games. ' +
        'No notebooks, no boredom 😄 And your results reach the teacher automatically.\n\n' +
        "Getting started is easy: tap the link from your teacher or center — that's it, no sign-up needed.",
      STUDENT:
        'Great to see you here! 🙌\n\n' +
        "As soon as your teacher gives an assignment, I'll let you know here. You learn the words by playing — " +
        'every correct answer earns points, and the result goes straight to your teacher. 🏆\n\n' +
        'Tap the button below to see your assignments 👇',
      TEACHER:
        'Welcome, teacher! 👨‍🏫\n\n' +
        'No more checking notebooks or asking in Telegram groups who did their homework.\n\n' +
        '• Create a group and send your students one link\n' +
        '• Type the words or upload a PDF/Word file\n' +
        '• See who finished and how many points they got — all in one place\n\n' +
        "I'll message you here as soon as a student finishes 😉",
      BRANCH_ADMIN:
        "Welcome! 🏫 Let's run your center together.\n\n" +
        'Send teachers one link — they join, create groups and invite students on their own. ' +
        'You keep an eye on how the whole center is doing.',
      SUPER_ADMIN:
        'Hi, boss! 😎\n\n' +
        "Add a new center and send its admin a link — they'll handle the rest. " +
        'Statistics for all centers are waiting for you in the app.',
    },
    roleLine: (role, branch) => `You're ${ROLE_NAMES.en[role]}${branch ? ` — ${branch}` : ''}. 😊`,
    guestLine: "I'm <b>EduTask</b> — a homework assistant for learning centers.",
    greet: { morning: 'Good morning', day: 'Hello', evening: 'Good evening', night: 'Hello' },
    invited: "You've been invited! 🎉 Tap the button below to join right away.\n\n",
    appReady: 'Here you go, the app is ready 👇',
    hello: (n) => `Hello, ${n}! 😊 How can I help?`,
    thanks: "You're welcome! 🤗 If you need anything else, I'm here.",
    fallback:
      "I can't understand free-form chat very well yet 😅, but I can always help with these commands:\n\n" +
      '/start — get acquainted\n/help — what I can do\n/app — open the app',
    loginAsk:
      "You're signing in to <b>Sozdon.uz</b> with Telegram.\n" +
      'Tap the button below to confirm 👇\n\n' +
      "<i>If you didn't just tap «Sign in with Telegram» on the site, don't confirm.</i>",
    loginConfirm: '✅ Confirm and sign in',
    loginConfirmed: 'Confirmed ✅',
    loginConfirmedText:
      "✅ <b>Confirmed!</b>\n\nGo back to the site — you're already signed in. If the page hasn't changed, tap the button below.",
    backToSozdon: '🌐 Back to Sozdon',
    requestExpired: 'Request expired',
    friend: 'friend',
  },
  ar: {
    openApp: '📱 افتح EduTask',
    contact: (u) => `\n\nهل تريد ربط مركزك؟ راسل @${u}.`,
    capabilities: {
      GUEST:
        'باختصار، أنا الجسر بين المعلم والطالب 🌉\n\n' +
        'يعطي المعلم كلمات كواجب منزلي — وأنت تحفظها في Sozdon عبر الألعاب. ' +
        'لا دفاتر ولا ملل 😄 ونتيجتك تصل إلى المعلم تلقائيًا.\n\n' +
        'البدء سهل جدًا: اضغط الرابط الذي أرسله معلمك أو مركزك — وهذا كل شيء، لا حاجة للتسجيل.',
      STUDENT:
        'سعيد برؤيتك هنا! 🙌\n\n' +
        'بمجرد أن يعطي المعلم واجبًا سأخبرك هنا. وأنت تحفظ الكلمات باللعب — ' +
        'كل إجابة صحيحة تعني نقاطًا، والنتيجة تصل فورًا إلى المعلم. 🏆\n\n' +
        'اضغط الزر أدناه لرؤية واجباتك 👇',
      TEACHER:
        'أهلًا بك أيها المعلم! 👨‍🏫\n\n' +
        'لا حاجة بعد الآن لتصحيح الدفاتر أو السؤال في مجموعة Telegram عمّن أنجز الواجب.\n\n' +
        '• أنشئ مجموعة وأرسل للطلاب رابطًا واحدًا\n' +
        '• اكتب الكلمات أو ارفع ملف PDF/Word\n' +
        '• من أنجز وكم نقطة حصل — كل ذلك في مكان واحد\n\n' +
        'سأكتب لك هنا فور انتهاء الطالب من الواجب 😉',
      BRANCH_ADMIN:
        'أهلًا بك! 🏫 لندير مركزك معًا.\n\n' +
        'أرسل للمعلمين رابطًا واحدًا — سينضمون وينشئون المجموعات ويدعون الطلاب بأنفسهم. ' +
        'وأنت تتابع سير العمل في المركز كله.',
      SUPER_ADMIN:
        'مرحبًا يا رئيس! 😎\n\n' +
        'أضف مركزًا جديدًا وأرسل رابطًا لمسؤوله — وسيتولون الباقي. ' +
        'إحصائيات جميع المراكز تنتظرك في التطبيق.',
    },
    roleLine: (role, branch) => `أنت ${ROLE_NAMES.ar[role]}${branch ? ` — ${branch}` : ''}. 😊`,
    guestLine: 'أنا <b>EduTask</b> — مساعد الواجبات المنزلية للمراكز التعليمية.',
    greet: { morning: 'صباح الخير', day: 'السلام عليكم', evening: 'مساء الخير', night: 'السلام عليكم' },
    invited: 'لقد تمت دعوتك! 🎉 اضغط الزر أدناه للانضمام فورًا.\n\n',
    appReady: 'تفضل، التطبيق جاهز 👇',
    hello: (n) => `وعليكم السلام، ${n}! 😊 كيف يمكنني مساعدتك؟`,
    thanks: 'العفو! 🤗 إذا احتجت أي شيء آخر فأنا هنا.',
    fallback:
      'لا أفهم المحادثة الحرة جيدًا بعد 😅، لكن يمكنني المساعدة دائمًا بهذه الأوامر:\n\n' +
      '/start — التعارف\n/help — ماذا أستطيع\n/app — فتح التطبيق',
    loginAsk:
      'أنت تريد تسجيل الدخول إلى موقع <b>Sozdon.uz</b> عبر Telegram.\n' +
      'اضغط الزر أدناه للتأكيد 👇\n\n' +
      '<i>إذا لم تضغط الآن «تسجيل الدخول عبر Telegram» في الموقع — فلا تؤكد.</i>',
    loginConfirm: '✅ تأكيد وتسجيل الدخول',
    loginConfirmed: 'تم التأكيد ✅',
    loginConfirmedText:
      '✅ <b>تم التأكيد!</b>\n\nعد إلى الموقع — لقد سجلت الدخول بالفعل. إذا لم تتغير الصفحة، اضغط الزر أدناه.',
    backToSozdon: '🌐 العودة إلى Sozdon',
    requestExpired: 'انتهت صلاحية الطلب',
    friend: 'صديقي',
  },
};

const openAppButton = (L: Lang, invite?: string): InlineButton => ({
  text: STR[L].openApp,
  web_app: { url: appUrl(invite) },
});

const contactLine = (L: Lang) => {
  const u = env.telegram.superAdminUsernames[0];
  return u ? STR[L].contact(u) : '';
};

/** Toshkent vaqti bo'yicha salomlashuv */
function greeting(L: Lang) {
  const h = (new Date().getUTCHours() + 5) % 24;
  const g = STR[L].greet;
  if (h >= 5 && h < 11) return g.morning;
  if (h >= 11 && h < 18) return g.day;
  if (h >= 18 && h < 23) return g.evening;
  return g.night;
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

interface TgFrom {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TgMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: TgFrom;
  text?: string;
}

interface TgCallbackQuery {
  id: string;
  from: TgFrom;
  data?: string;
  message?: TgMessage;
}

// ---------------------------------------------------------------------------
// Sozdon.uz'ga bot orqali kirish.
// Sayt: t.me/sozdon_bot?start=login_<nonce>  →  bot tasdiqlash tugmasini ko'rsatadi
// → bosilganda TelegramLogin yoziladi → Sozdon serveri uni bir marta oladi.
// ---------------------------------------------------------------------------
const LOGIN_NONCE_RE = /^[a-f0-9]{32}$/;
const sozdonLoginUrl = () => `${env.sozdon.url}/login`;

async function askLoginConfirm(chatId: number, nonce: string, firstName: string, L: Lang) {
  await reply(chatId, `${greeting(L)}, ${firstName}! 👋\n\n` + STR[L].loginAsk, [
    [{ text: STR[L].loginConfirm, callback_data: `sl:${nonce}` }],
  ]);
}

async function confirmLogin(cb: TgCallbackQuery, nonce: string) {
  await prisma.telegramLogin.upsert({
    where: { nonce },
    create: {
      nonce,
      telegramId: String(cb.from.id),
      telegramUsername: cb.from.username ?? null,
      firstName: cb.from.first_name ?? null,
      lastName: cb.from.last_name ?? null,
    },
    update: {},
  });
  // Eski (10 daqiqadan ortiq) so'rovlarni tozalash
  await prisma.telegramLogin.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 10 * 60_000) } } });

  const L = langOf(cb.from.language_code);
  await tg('answerCallbackQuery', { callback_query_id: cb.id, text: STR[L].loginConfirmed });
  if (cb.message) {
    await tg('editMessageText', {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      parse_mode: 'HTML',
      text: STR[L].loginConfirmedText,
      reply_markup: { inline_keyboard: [[{ text: STR[L].backToSozdon, url: sozdonLoginUrl() }]] },
    });
  }
}

/** Sozdon serveri uchun: tasdiqlangan kirishni bir marta beradi va o'chiradi. */
export async function claimSozdonLogin(nonce: string) {
  if (!LOGIN_NONCE_RE.test(nonce)) return null;
  const row = await prisma.telegramLogin.findUnique({ where: { nonce } });
  if (!row) return null;
  await prisma.telegramLogin.delete({ where: { nonce } }).catch(() => {});
  if (Date.now() - row.createdAt.getTime() > 10 * 60_000) return null;
  return {
    telegramId: row.telegramId,
    username: row.telegramUsername,
    firstName: row.firstName,
    lastName: row.lastName,
  };
}

export async function handleUpdate(update: { message?: TgMessage; callback_query?: TgCallbackQuery }) {
  const cb = update.callback_query;
  if (cb?.data?.startsWith('sl:')) {
    const nonce = cb.data.slice(3);
    if (LOGIN_NONCE_RE.test(nonce)) await confirmLogin(cb, nonce);
    else
      await tg('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: STR[langOf(cb.from.language_code)].requestExpired,
      });
    return;
  }

  const msg = update.message;
  if (!msg?.text || msg.chat.type !== 'private' || !msg.from) return;

  const text = msg.text.trim();
  const [command, payload] = text.split(/\s+/, 2);
  const L = langOf(msg.from.language_code);
  const S = STR[L];
  const firstName = escapeHtml(msg.from.first_name || S.friend);

  if (command === '/start' && payload?.startsWith('login_')) {
    const nonce = payload.slice('login_'.length);
    if (LOGIN_NONCE_RE.test(nonce)) {
      await askLoginConfirm(msg.chat.id, nonce, firstName, L);
      return;
    }
  }
  const user = await prisma.user.findUnique({
    where: { telegramId: String(msg.from.id) },
    include: { branch: { select: { name: true } } },
  });
  const role: Role | 'GUEST' = user?.role ?? 'GUEST';

  if (command === '/start') {
    const invite = payload && /^[A-Za-z0-9]{6,20}$/.test(payload) ? payload : undefined;
    const who = user ? S.roleLine(user.role, user.branch ? escapeHtml(user.branch.name) : '') : S.guestLine;
    const intro =
      `${greeting(L)}, ${firstName}! 👋\n${who}\n\n` +
      (invite ? S.invited : '') +
      S.capabilities[role] +
      (user ? '' : contactLine(L));
    await reply(msg.chat.id, intro, [[openAppButton(L, invite)]]);
    return;
  }

  if (command === '/help' || command === '/imkoniyatlar') {
    await reply(msg.chat.id, S.capabilities[role] + (user ? '' : contactLine(L)), [[openAppButton(L)]]);
    return;
  }

  if (command === '/app') {
    await reply(msg.chat.id, S.appReady, [[openAppButton(L)]]);
    return;
  }

  // Erkin matn — do'stona javob
  const lower = text.toLowerCase();
  let answer: string;
  if (/^(salom|assalom|asalom|hi|hello|privet|привет|здравствуй|السلام|مرحبا)/.test(lower)) {
    answer = S.hello(firstName);
  } else if (/(rahmat|raxmat|spasibo|thanks|спасибо|شكرا)/.test(lower)) {
    answer = S.thanks;
  } else {
    answer = S.fallback;
  }
  await reply(msg.chat.id, answer, [[openAppButton(L)]]);
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
      allowed_updates: ['message', 'callback_query'],
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
  // Foydalanuvchining Telegram tiliga mos buyruqlar va tavsiflar
  const LOCALIZED: { lang: string; commands: [string, string, string]; short: string; long: string }[] = [
    {
      lang: 'ru',
      commands: ['Начать', 'Возможности', 'Открыть приложение EduTask'],
      short: 'Домашние задания для учебных центров: учитель задаёт, ученик учит слова, играя.',
      long:
        'Здравствуйте! 👋 Я EduTask — помощник учителей и учеников.\n\n' +
        'Учитель задаёт слова на дом, ученик учит их, играя, а результат сам приходит учителю. ' +
        'Без тетрадей и путаницы 😊\n\nНажмите «Старт» — давайте знакомиться!',
    },
    {
      lang: 'en',
      commands: ['Start', 'What I can do', 'Open the EduTask app'],
      short: 'Homework for learning centers: the teacher assigns, the student learns words by playing.',
      long:
        "Hello! 👋 I'm EduTask — an assistant for teachers and students.\n\n" +
        'The teacher assigns words, the student learns them by playing, and the result reaches the teacher automatically. ' +
        'No notebooks, no confusion 😊\n\nTap «Start» — let\'s get acquainted!',
    },
    {
      lang: 'ar',
      commands: ['البدء', 'ماذا أستطيع', 'فتح تطبيق EduTask'],
      short: 'واجبات منزلية للمراكز التعليمية: المعلم يكلّف والطالب يحفظ الكلمات باللعب.',
      long:
        'السلام عليكم! 👋 أنا EduTask — مساعد المعلمين والطلاب.\n\n' +
        'يعطي المعلم كلمات كواجب، ويحفظها الطالب باللعب، وتصل النتيجة إلى المعلم تلقائيًا. ' +
        'لا دفاتر ولا ارتباك 😊\n\nاضغط «ابدأ» — لنتعارف!',
    },
  ];
  for (const l of LOCALIZED) {
    await tg('setMyCommands', {
      language_code: l.lang,
      commands: [
        { command: 'start', description: l.commands[0] },
        { command: 'help', description: l.commands[1] },
        { command: 'app', description: l.commands[2] },
      ],
    });
    await tg('setMyShortDescription', { language_code: l.lang, short_description: l.short });
    await tg('setMyDescription', { language_code: l.lang, description: l.long });
  }
  console.log('[bot] sozlandi', base ? `(webhook: ${base}/api/telegram/webhook)` : '(webhook URL yo\'q)');
}
