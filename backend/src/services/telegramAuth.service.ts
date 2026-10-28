import crypto from 'crypto';
import { Role, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { hashPassword } from '../utils/hash';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { verifyTelegramInitData, TelegramUser } from '../utils/telegram';

function issueSession(user: User) {
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role, branchId: user.branchId }),
    refreshToken: signRefreshToken({ sub: user.id }),
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      branchId: user.branchId,
    },
  };
}

function displayName(tg: TelegramUser) {
  const name = [tg.first_name, tg.last_name].filter(Boolean).join(' ').trim();
  return name || tg.username || `Foydalanuvchi ${tg.id}`;
}

/** Telegram foydalanuvchisi uchun parolsiz akkaunt maydonlari. */
async function telegramAccountFields(tg: TelegramUser) {
  return {
    phone: `tg:${tg.id}`,
    // Parol bilan kirib bo'lmaydi: tasodifiy, hech kimga ma'lum bo'lmagan qiymat
    passwordHash: await hashPassword(crypto.randomBytes(24).toString('hex')),
    fullName: displayName(tg),
    telegramId: String(tg.id),
    telegramUsername: tg.username ?? null,
  };
}

/** O'quvchi guruhga qo'shilganda, guruhdagi faol vazifalar uchun natija qatorlarini ochadi. */
export async function ensureResultsForStudent(studentId: string, groupId: string) {
  const homeworks = await prisma.homework.findMany({
    where: { groupId, endDate: { gte: new Date() } },
    select: { id: true, _count: { select: { words: true } } },
  });
  if (homeworks.length === 0) return;
  await prisma.homeworkResult.createMany({
    data: homeworks.map((h) => ({ homeworkId: h.id, studentId, totalCount: h._count.words })),
    skipDuplicates: true,
  });
}

async function findActiveInvite(code: string) {
  const invite = await prisma.invite.findUnique({ where: { code } });
  if (!invite || !invite.isActive || invite.expiresAt < new Date()) return null;
  return invite;
}

async function acceptInvite(code: string, tg: TelegramUser, existing: User | null): Promise<User | null> {
  const invite = await findActiveInvite(code);
  if (!invite) return null;

  // Mavjud o'quvchi boshqa guruh havolasini ochsa — o'sha guruhga o'tkaziladi
  if (existing) {
    if (existing.role === Role.STUDENT && invite.role === Role.STUDENT && invite.groupId) {
      const student = await prisma.student.update({
        where: { userId: existing.id },
        data: { groupId: invite.groupId, branchId: invite.branchId },
      });
      await prisma.user.update({ where: { id: existing.id }, data: { branchId: invite.branchId } });
      await prisma.invite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
      await ensureResultsForStudent(student.id, invite.groupId);
      return prisma.user.findUnique({ where: { id: existing.id } });
    }
    return existing; // boshqa rollar uchun havola mavjud akkauntni o'zgartirmaydi
  }

  const base = await telegramAccountFields(tg);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { ...base, role: invite.role, branchId: invite.branchId },
    });
    if (invite.role === Role.TEACHER) {
      await tx.teacher.create({ data: { userId: created.id, branchId: invite.branchId } });
    }
    if (invite.role === Role.STUDENT) {
      await tx.student.create({
        data: { userId: created.id, branchId: invite.branchId, groupId: invite.groupId },
      });
    }
    await tx.invite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
    return created;
  });

  if (invite.role === Role.STUDENT && invite.groupId) {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (student) await ensureResultsForStudent(student.id, invite.groupId);
  }
  return user;
}

export async function loginWithTelegram(initData: string, startParamFromBody?: string) {
  if (!env.telegram.botToken) {
    throw ApiError.internal("Telegram bot sozlanmagan (TELEGRAM_BOT_TOKEN)");
  }
  const verified = verifyTelegramInitData(initData, env.telegram.botToken);
  if (!verified) throw ApiError.unauthorized("Telegram ma'lumotlari tasdiqlanmadi");

  const tg = verified.user;
  const telegramId = String(tg.id);
  const code = verified.startParam || startParamFromBody;

  let user = await prisma.user.findUnique({ where: { telegramId } });

  // Super admin: Telegram ID muhit o'zgaruvchisida ko'rsatilgan
  const isSuperAdmin =
    env.telegram.superAdminIds.includes(telegramId) ||
    (!!tg.username && env.telegram.superAdminUsernames.includes(tg.username.toLowerCase()));
  if (isSuperAdmin) {
    if (!user) {
      user = await prisma.user.create({
        data: { ...(await telegramAccountFields(tg)), role: Role.SUPER_ADMIN },
      });
    } else if (user.role !== Role.SUPER_ADMIN) {
      user = await prisma.user.update({ where: { id: user.id }, data: { role: Role.SUPER_ADMIN } });
    }
  } else if (code) {
    user = await acceptInvite(code, tg, user);
  }

  if (!user) {
    throw ApiError.forbidden(
      "Siz hali ro'yxatda yo'qsiz. Ustozingiz yoki markaz adminingiz bergan havola orqali kiring.",
    );
  }
  if (!user.isActive) throw ApiError.forbidden('Akkaunt bloklangan');

  // Ism yoki username o'zgargan bo'lsa yangilab qo'yamiz
  if (user.telegramUsername !== (tg.username ?? null)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { telegramUsername: tg.username ?? null },
    });
  }

  return issueSession(user);
}
