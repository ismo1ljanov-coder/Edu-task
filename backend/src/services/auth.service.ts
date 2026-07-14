import { prisma } from '../config/prisma';
import { comparePassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

export async function loginWithPhone(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Telefon raqami yoki parol noto'g'ri");
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized("Telefon raqami yoki parol noto'g'ri");
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    branchId: user.branchId,
  });
  const refreshToken = signRefreshToken({ sub: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      branchId: user.branchId,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let decoded: { sub: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Refresh token yaroqsiz");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Foydalanuvchi topilmadi yoki bloklangan");
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    branchId: user.branchId,
  });

  return { accessToken };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      role: true,
      branchId: true,
      branch: { select: { id: true, name: true } },
    },
  });
  if (!user) throw ApiError.notFound('Foydalanuvchi topilmadi');
  return user;
}
