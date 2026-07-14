import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { ApiError } from '../utils/ApiError';

// Only keep tokens that look like real English words (letters only, 2+ chars),
// de-duplicated and lowercased. This is a lightweight heuristic — good enough
// for turning teacher-uploaded material into a "So'zdon" word list.
const ENGLISH_WORD_REGEX = /^[a-zA-Z]{2,}$/;

// A short, common stop-word list so the extracted list is mostly vocabulary,
// not glue words like "the", "and", "is".
const STOP_WORDS = new Set([
  'the', 'and', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of',
  'in', 'on', 'at', 'for', 'with', 'as', 'by', 'it', 'this', 'that', 'or', 'but',
  'not', 'from', 'you', 'your', 'i', 'we', 'they', 'he', 'she', 'his', 'her',
]);

function extractEnglishWords(rawText: string): string[] {
  const tokens = rawText.match(/[A-Za-z]+/g) ?? [];
  const seen = new Set<string>();
  const words: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!ENGLISH_WORD_REGEX.test(lower)) continue;
    if (STOP_WORDS.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    words.push(lower);
  }

  return words;
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const parsed = await pdfParse(buffer);
  return parsed.text;
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractFromXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let text = '';
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    for (const row of rows) {
      text += row.join(' ') + '\n';
    }
  }
  return text;
}

export type SupportedUploadType = 'PDF' | 'DOCX' | 'XLSX';

export function detectFileType(mimeType: string, originalName: string): SupportedUploadType {
  const ext = originalName.split('.').pop()?.toLowerCase();
  if (mimeType.includes('pdf') || ext === 'pdf') return 'PDF';
  if (
    mimeType.includes('officedocument.wordprocessingml') ||
    ext === 'docx'
  ) {
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
  throw ApiError.badRequest('Fayl formati qo\'llab-quvvatlanmaydi (PDF, DOCX yoki XLSX kerak)');
}

/**
 * Extracts unique English words from an uploaded homework material file.
 * Used by the Homework creation flow: teacher uploads a file, and the system
 * automatically pulls out the vocabulary list stored as HomeworkWord rows.
 */
export async function extractWordsFromFile(
  buffer: Buffer,
  fileType: SupportedUploadType,
): Promise<string[]> {
  let rawText = '';

  switch (fileType) {
    case 'PDF':
      rawText = await extractFromPdf(buffer);
      break;
    case 'DOCX':
      rawText = await extractFromDocx(buffer);
      break;
    case 'XLSX':
      rawText = extractFromXlsx(buffer);
      break;
  }

  return extractEnglishWords(rawText);
}
