import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { ApiError } from '../utils/ApiError';

// ---------------------------------------------------------------------------
// Ustoz yuklagan fayl yoki qo'lda yozgan matndan so'zlar ro'yxatini ajratadi.
//
// Ustozlar odatda ro'yxatni "apple — olma" ko'rinishida beradi. Shuning uchun:
//  1) Har bir qatorda "so'z — tarjima" juftligi bo'lsa, ikkalasi ham olinadi
//     (ajratgichlar: — – - : = tab yoki 2+ bo'shliq; Excel'da 1-ustun so'z, 2-ustun tarjima).
//  2) Juftlik bo'lmasa, faqat vazifa tilidagi harflardan iborat so'zlar olinadi.
//     Inglizcha vazifada o'zbekcha lotin so'zlar ham ilashib qolmasligi uchun
//     o'zbekchaga xos belgili (o', g', sh+apostrof) so'zlar tashlab yuboriladi.
// ---------------------------------------------------------------------------

export type HomeworkLanguage = 'en' | 'ru' | 'ar';
export const HOMEWORK_LANGUAGES: HomeworkLanguage[] = ['en', 'ru', 'ar'];

export interface ExtractedWord {
  word: string;
  translation?: string;
}

const MAX_WORDS = 300;

const SCRIPT: Record<HomeworkLanguage, { token: RegExp; word: RegExp }> = {
  en: { token: /[A-Za-z]+(?:[-'][A-Za-z]+)*/g, word: /^[A-Za-z]+(?:[-' ][A-Za-z]+){0,3}$/ },
  ru: { token: /[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*/g, word: /^[А-Яа-яЁё]+(?:[- ][А-Яа-яЁё]+){0,3}$/ },
  ar: { token: /[ء-يً-ٰٟ]+/g, word: /^[ء-يً-ٰٟ]+(?: [ء-يً-ٰٟ]+){0,3}$/ },
};

const STOP_WORDS: Record<HomeworkLanguage, Set<string>> = {
  en: new Set([
    'the', 'and', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of',
    'in', 'on', 'at', 'for', 'with', 'as', 'by', 'it', 'this', 'that', 'or', 'but',
    'not', 'from', 'you', 'your', 'i', 'we', 'they', 'he', 'she', 'his', 'her',
    'unit', 'lesson', 'page', 'exercise', 'vocabulary', 'words',
  ]),
  ru: new Set(['и', 'в', 'на', 'не', 'что', 'с', 'по', 'это', 'а', 'но', 'к', 'у', 'из', 'за', 'о', 'же', 'то', 'как', 'урок', 'слова']),
  ar: new Set(['في', 'من', 'على', 'إلى', 'عن', 'و', 'أن', 'هذا', 'هذه', 'التي', 'الذي', 'مع', 'كان', 'درس']),
};

// O'zbekcha lotin yozuviga xos: o', g', o‘, g‘, sh/ch bilan birga apostrof, ʻ
const UZBEK_MARK = /[oOgG]['‘’ʻ`]|ʻ/;
// Juftlik ajratgichlari
const PAIR_SPLIT = /\s+[—–-]\s+|\s*[—–:=\t]\s*|\s{2,}|\s+-\s*/;

function cleanTranslation(s: string): string {
  return s
    .replace(/^[\s\-—–:=.,;]+|[\s.,;]+$/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

function normalizeWord(s: string, lang: HomeworkLanguage): string {
  const w = s.trim().replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ');
  return lang === 'en' || lang === 'ru' ? w.toLowerCase() : w;
}

/** Bitta qatordan "so'z — tarjima" juftligini ajratishga urinadi. */
function parsePair(line: string, lang: HomeworkLanguage): ExtractedWord | null {
  const parts = line.split(PAIR_SPLIT).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const word = normalizeWord(parts[0], lang);
  if (!SCRIPT[lang].word.test(word)) return null;
  if (lang === 'en' && UZBEK_MARK.test(parts[0])) return null;
  const translation = cleanTranslation(parts.slice(1).join(' '));
  if (!translation) return null;
  return { word, translation };
}

export function extractWordEntries(rawText: string, lang: HomeworkLanguage = 'en'): ExtractedWord[] {
  const out: ExtractedWord[] = [];
  const seen = new Map<string, number>();
  const add = (e: ExtractedWord) => {
    const k = e.word.toLowerCase();
    const idx = seen.get(k);
    if (idx !== undefined) {
      if (!out[idx].translation && e.translation) out[idx].translation = e.translation;
      return;
    }
    if (out.length >= MAX_WORDS) return;
    seen.set(k, out.length);
    out.push(e);
  };

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const pair = parsePair(line, lang);
    if (pair) {
      add(pair);
      continue;
    }
    // Juftlik yo'q — qatordagi vazifa tilidagi so'zlarni olamiz
    for (const token of line.match(SCRIPT[lang].token) ?? []) {
      // Inglizcha: o'zbekcha belgili so'zni tashlaymiz (qator ichida apostrof bilan)
      if (lang === 'en') {
        const at = line.indexOf(token);
        const around = line.slice(Math.max(0, at - 1), at + token.length + 2);
        if (UZBEK_MARK.test(around)) continue;
      }
      const w = normalizeWord(token, lang);
      if (w.length < 2 || STOP_WORDS[lang].has(w)) continue;
      add({ word: w });
    }
  }
  // Fayl lug'at ro'yxati ko'rinishida bo'lsa ("so'z — tarjima"), juftsiz qolgan so'zlar odatda
  // sarlavha yoki misol gaplardan ilashgan bo'ladi — ularni tashlaymiz.
  const paired = out.filter((e) => e.translation);
  if (paired.length >= 3 && paired.length >= out.length * 0.3) return paired;
  return out;
}

/** Qo'lda kiritilgan matn: har qatorda yoki vergul bilan; "so'z - tarjima" ham bo'lishi mumkin. */
export function parseManualWords(raw: string, lang: HomeworkLanguage): ExtractedWord[] {
  const text = raw.includes('\n') ? raw : raw.split(',').join('\n');
  return extractWordEntries(text, lang);
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/** Excel: har qator → ustunlar tab bilan (1-ustun so'z, 2-ustun tarjima deb o'qiladi). */
function extractFromXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let text = '';
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    for (const row of rows) {
      const cells = row.map((c) => String(c ?? '').trim()).filter(Boolean);
      if (cells.length) text += cells.join('\t') + '\n';
    }
  }
  return text;
}

export type SupportedUploadType = 'PDF' | 'DOCX' | 'XLSX';

export function detectFileType(mimeType: string, originalName: string): SupportedUploadType {
  const ext = originalName.split('.').pop()?.toLowerCase();
  if (mimeType.includes('pdf') || ext === 'pdf') return 'PDF';
  if (mimeType.includes('officedocument.wordprocessingml') || ext === 'docx') {
    return 'DOCX';
  }
  if (
    mimeType.includes('officedocument.spreadsheetml') ||
    mimeType.includes('ms-excel') ||
    ext === 'xlsx' ||
    ext === 'xls'
  ) {
    return 'XLSX';
  }
  throw ApiError.badRequest("Fayl formati qo'llab-quvvatlanmaydi (PDF, DOCX yoki XLSX kerak)");
}

export async function extractWordsFromFile(
  buffer: Buffer,
  fileType: SupportedUploadType,
  lang: HomeworkLanguage = 'en',
): Promise<ExtractedWord[]> {
  let text = '';
  try {
    if (fileType === 'PDF') text = await extractFromPdf(buffer);
    else if (fileType === 'DOCX') text = await extractFromDocx(buffer);
    else text = extractFromXlsx(buffer);
  } catch {
    throw ApiError.badRequest("Faylni o'qib bo'lmadi. Fayl buzilmaganini tekshiring.");
  }
  const words = extractWordEntries(text, lang);
  if (!words.length) {
    throw ApiError.badRequest(
      "Fayldan so'z topilmadi. Agar bu skanerlangan (rasm ko'rinishidagi) PDF bo'lsa, so'zlarni qo'lda kiriting.",
    );
  }
  return words;
}
