import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/apiResponse';

interface CreatePersonInput {
  fullName: string;
  phone: string;
  password: string;
  branchId: string;
}

async function assertPhoneAvailable(phone: string) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) throw ApiError.conflict('Bu telefon raqami allaqachon ro\'yxatdan o\'tgan');
}

// --- Super Admin: assign a Branch Admin to a branch --------------------------
export async function createBranchAdmin(input: CreatePersonInput) {
  await assertPhoneAvailable(input.phone);
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      passwordHash,
      role: Role.BRANCH_ADMIN,
      branchId: input.branchId,
    },
    select: { id: true, fullName: true, phone: true, role: true, branchId: true },
  });
}

// --- Branch Admin: add a teacher --------------------------------------------
export async function createTeacher(input: CreatePersonInput) {
  await assertPhoneAvailable(input.phone);
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      passwordHash,
      role: Role.TEACHER,
      branchId: input.branchId,
      teacher: { create: { branchId: input.branchId } },
    },
    include: { teacher: true },
  });
}

// --- Branch Admin: add a student --------------------------------------------
export async function createStudent(input: CreatePersonInput & { groupId?: string }) {
  await assertPhoneAvailable(input.phone);
  const passwordHash = await hashPassword(input.password);

  const student = await prisma.user.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      passwordHash,
      role: Role.STUDENT,
      branchId: input.branchId,
      student: {
        create: {
          branchId: input.branchId,
          groupId: input.groupId,
        },
      },
    },
    include: { student: true },
  });

  // Notify the teacher(s) of the group that a new student joined.
  if (input.groupId) {
    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
      include: { teacher: true },
    });
    if (group) {
      await prisma.notification.create({
        data: {
          userId: group.teacher.userId,
          type: 'NEW_STUDENT',
          title: "Yangi o'quvchi",
          message: `${input.fullName} "${group.name}" guruhiga qo'shildi`,
        },
      });
    }
  }

  return student;
}

export async function listTeachers(branchId: string, page: number, limit: number, skip: number) {
  const where = { role: Role.TEACHER, branchId };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        teacher: {
          select: { id: true, _count: { select: { groups: true, homeworks: true } } },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}

export async function listStudents(branchId: string, page: number, limit: number, skip: number) {
  const where = { role: Role.STUDENT, branchId };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        student: { select: { id: true, xp: true, streak: true, groupId: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, pagination: buildPagination(page, limit, total) };
}

// --- Branch Admin: mark a student's monthly payment status -----------------
export async function setPaymentStatus(
  studentId: string,
  month: Date,
  status: 'PAID' | 'UNPAID' | 'OVERDUE',
  amount: number,
) {
  return prisma.payment.upsert({
    where: { studentId_month: { studentId, month } },
    update: { status, amount, paidAt: status === 'PAID' ? new Date() : null },
    create: { studentId, month, amount, status, paidAt: status === 'PAID' ? new Date() : null },
  });
}

// --- Branch Admin: teacher activity overview --------------------------------
export async function getTeacherActivity(teacherUserId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    include: {
      groups: { include: { _count: { select: { students: true } } } },
      homeworks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { _count: { select: { results: true } } },
      },
    },
  });
  if (!teacher) throw ApiError.notFound("O'qituvchi topilmadi");
  return teacher;
}
