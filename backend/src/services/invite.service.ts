import crypto from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const INVITE_TTL_DAYS = 30;
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 10) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function inviteLink(code: string) {
  return `https://t.me/${env.telegram.botUsername}/${env.telegram.appShortName}?startapp=${code}`;
}

interface Actor {
  id: string;
  role: Role;
  branchId: string | null;
}

interface CreateInviteInput {
  role: Role;
  branchId?: string;
  groupId?: string;
}

/**
 * Kim kimni taklif qila oladi:
 * - SUPER_ADMIN: istalgan markazga markaz admini / ustoz / o'quvchi
 * - BRANCH_ADMIN: o'z markaziga ustoz, o'z markazidagi guruhga o'quvchi
 * - TEACHER: o'z guruhiga o'quvchi
 */
export async function createInvite(actor: Actor, input: CreateInviteInput) {
  if (input.role === Role.SUPER_ADMIN) throw ApiError.forbidden("Super admin taklif qilib bo'lmaydi");

  let branchId = input.branchId;
  let groupId: string | undefined;

  if (input.role === Role.STUDENT) {
    if (!input.groupId) throw ApiError.badRequest("O'quvchi uchun guruh tanlanishi kerak");
    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
      include: { teacher: true },
    });
    if (!group || !group.isActive) throw ApiError.notFound('Guruh topilmadi');
    if (actor.role === Role.TEACHER && group.teacher.userId !== actor.id) {
      throw ApiError.forbidden('Bu guruh sizga tegishli emas');
    }
    if (actor.role === Role.BRANCH_ADMIN && group.branchId !== actor.branchId) {
      throw ApiError.forbidden('Bu guruh sizning markazingizda emas');
    }
    branchId = group.branchId;
    groupId = group.id;
  } else {
    if (actor.role === Role.TEACHER) throw ApiError.forbidden("Ustoz faqat o'quvchi taklif qila oladi");
    if (actor.role === Role.BRANCH_ADMIN) {
      if (input.role !== Role.TEACHER) throw ApiError.forbidden('Markaz admini faqat ustoz taklif qila oladi');
      branchId = actor.branchId ?? undefined;
    }
    if (!branchId) throw ApiError.badRequest('Markaz tanlanishi kerak');
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || !branch.isActive) throw ApiError.notFound('Markaz topilmadi');
  }

  // Bir xil maqsad uchun faol havola bo'lsa — o'shani qaytaramiz (har safar yangisi chiqmasin)
  const existing = await prisma.invite.findFirst({
    where: {
      role: input.role,
      branchId: branchId!,
      groupId: groupId ?? null,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  const invite =
    existing ??
    (await prisma.invite.create({
      data: {
        code: generateCode(),
        role: input.role,
        branchId: branchId!,
        groupId,
        createdById: actor.id,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    }));

  return {
    code: invite.code,
    role: invite.role,
    link: inviteLink(invite.code),
    uses: invite.uses,
    expiresAt: invite.expiresAt,
  };
}
