import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/apiResponse';

export async function listBranches(page: number, limit: number, skip: number) {
  const [items, total] = await Promise.all([
    prisma.branch.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { teachers: true, students: true, groups: true } },
      },
    }),
    prisma.branch.count(),
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}

export async function createBranch(data: { name: string; address?: string; phone?: string }) {
  return prisma.branch.create({ data });
}

export async function updateBranch(
  id: string,
  data: Partial<{ name: string; address: string; phone: string; isActive: boolean }>,
) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw ApiError.notFound('Filial topilmadi');
  return prisma.branch.update({ where: { id }, data });
}

export async function getBranchStats(id: string) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw ApiError.notFound('Filial topilmadi');

  const [teacherCount, studentCount, activeStudents, paymentStats] = await Promise.all([
    prisma.teacher.count({ where: { branchId: id } }),
    prisma.student.count({ where: { branchId: id } }),
    prisma.student.count({
      where: { branchId: id, user: { isActive: true } },
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: { student: { branchId: id } },
      _count: true,
    }),
  ]);

  return {
    branch,
    teacherCount,
    studentCount,
    activeStudents,
    paymentBreakdown: paymentStats.map((p) => ({ status: p.status, count: p._count })),
  };
}
