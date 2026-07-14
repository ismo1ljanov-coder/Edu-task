import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/apiResponse';

export async function createGroup(data: { name: string; branchId: string; teacherId: string }) {
  const teacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
  if (!teacher || teacher.branchId !== data.branchId) {
    throw ApiError.badRequest("Bu o'qituvchi ushbu filialga tegishli emas");
  }
  return prisma.group.create({ data });
}

export async function updateGroup(
  id: string,
  branchId: string,
  data: Partial<{ name: string; teacherId: string; isActive: boolean }>,
) {
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group || group.branchId !== branchId) throw ApiError.notFound('Guruh topilmadi');
  return prisma.group.update({ where: { id }, data });
}

export async function listGroups(branchId: string, page: number, limit: number, skip: number) {
  const where = { branchId };
  const [items, total] = await Promise.all([
    prisma.group.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        _count: { select: { students: true, homeworks: true } },
      },
    }),
    prisma.group.count({ where }),
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}

export async function listGroupsForTeacher(teacherId: string) {
  return prisma.group.findMany({
    where: { teacherId },
    include: { _count: { select: { students: true, homeworks: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addStudentToGroup(groupId: string, studentId: string, branchId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.branchId !== branchId) throw ApiError.notFound('Guruh topilmadi');
  return prisma.student.update({ where: { id: studentId }, data: { groupId } });
}
