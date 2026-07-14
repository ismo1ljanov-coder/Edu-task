import { prisma } from '../config/prisma';

export async function getPlatformStats() {
  const [branchCount, teacherCount, studentCount, activeUserCount, paymentByStatus] =
    await Promise.all([
      prisma.branch.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.payment.groupBy({ by: ['status'], _count: true }),
    ]);

  return {
    branchCount,
    teacherCount,
    studentCount,
    activeUserCount,
    paymentBreakdown: paymentByStatus.map((p) => ({ status: p.status, count: p._count })),
  };
}

export async function getBranchesReportRows() {
  const branches = await prisma.branch.findMany({
    include: {
      _count: { select: { teachers: true, students: true, groups: true } },
    },
    orderBy: { name: 'asc' },
  });

  return branches.map((b) => ({
    name: b.name,
    teachers: b._count.teachers,
    students: b._count.students,
    groups: b._count.groups,
    isActive: b.isActive ? 'Faol' : 'Faol emas',
  }));
}
