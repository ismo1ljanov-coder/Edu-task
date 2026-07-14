import { prisma } from '../config/prisma';

export async function (userIderId: skip page: number, skip: number) {
  const where = { userId };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, total, unreadCount };
}

export async function markAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function createAnnouncement(userIds: string[], title: string, message: string) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type: 'ANNOUNCEMENT' as const, title, message })),
  });
}
