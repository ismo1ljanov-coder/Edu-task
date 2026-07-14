import { Response } from 'express';
import * as statsService from '../services/stats.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const platformStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const stats = await statsService.getPlatformStats();
  sendSuccess(res, stats);
});

// Generates a simple tabular PDF report of all branches (name, teacher/student
// counts, status) using pdfkit-free plain PDF composition via pdf-lib-style
// text layout is overkill for an MVP — we build a minimal PDF with pdfmake-like
// approach using the 'pdfkit' pattern through a tiny inline generator.
export const exportBranchesPdf = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const rows = await statsService.getBranchesReportRows();

  // Lightweight, dependency-free PDF text rendering.
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;

  page.drawText('EduTask — Filiallar hisobot', { x: 40, y, size: 16, font: bold });
  y -= 30;

  const headers = ['Filial', "O'qituvchi", "O'quvchi", 'Guruh', 'Holat'];
  const colX = [40, 220, 300, 380, 460];
  headers.forEach((h, i) => page.drawText(h, { x: colX[i], y, size: 11, font: bold }));
  y -= 18;

  for (const row of rows) {
    if (y < 60) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    const values = [row.name, String(row.teachers), String(row.students), String(row.groups), row.isActive];
    values.forEach((v, i) =>
      page.drawText(v, { x: colX[i], y, size: 10, font, color: rgb(0.1, 0.1, 0.1) }),
    );
    y -= 16;
  }

  const bytes = await doc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="edutask-branches-report.pdf"');
  res.send(Buffer.from(bytes));
});
