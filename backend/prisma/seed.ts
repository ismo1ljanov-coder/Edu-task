import { PrismaClient, Role, HomeworkLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { phone: '+998900000001' },
    update: {},
    create: {
      phone: '+998900000001',
      fullName: 'Super Admin',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: 'seed-branch-1' },
    update: {},
    create: {
      id: 'seed-branch-1',
      name: 'EduTask — Chilonzor filiali',
      address: 'Toshkent, Chilonzor tumani',
      phone: '+998712345678',
    },
  });

  const branchAdminUser = await prisma.user.upsert({
    where: { phone: '+998900000002' },
    update: {},
    create: {
      phone: '+998900000002',
      fullName: 'Filial Admin',
      passwordHash,
      role: Role.BRANCH_ADMIN,
      branchId: branch.id,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { phone: '+998900000003' },
    update: {},
    create: {
      phone: '+998900000003',
      fullName: "Malika O'qituvchi",
      passwordHash,
      role: Role.TEACHER,
      branchId: branch.id,
      teacher: { create: { branchId: branch.id } },
    },
    include: { teacher: true },
  });

  const teacher = await prisma.teacher.findUniqueOrThrow({ where: { userId: teacherUser.id } });

  const group = await prisma.group.upsert({
    where: { id: 'seed-group-1' },
    update: {},
    create: {
      id: 'seed-group-1',
      name: 'Intermediate — A1',
      branchId: branch.id,
      teacherId: teacher.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { phone: '+998900000004' },
    update: {},
    create: {
      phone: '+998900000004',
      fullName: "Aziz O'quvchi",
      passwordHash,
      role: Role.STUDENT,
      branchId: branch.id,
      student: { create: { branchId: branch.id, groupId: group.id, xp: 120, streak: 4 } },
    },
  });

  const student = await prisma.student.findUniqueOrThrow({ where: { userId: studentUser.id } });

  const homework = await prisma.homework.upsert({
    where: { id: 'seed-homework-1' },
    update: {},
    create: {
      id: 'seed-homework-1',
      title: 'Unit 3 — Daily Routines',
      description: "Kundalik faoliyat mavzusidagi so'zlarni yodlang",
      level: HomeworkLevel.INTERMEDIATE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      teacherId: teacher.id,
      groupId: group.id,
      sourceFileType: 'MANUAL',
      words: {
        create: ['breakfast', 'commute', 'schedule', 'routine', 'exercise'].map((word, i) => ({
          word,
          order: i,
        })),
      },
    },
  });

  await prisma.homeworkResult.upsert({
    where: { homeworkId_studentId: { homeworkId: homework.id, studentId: student.id } },
    update: {},
    create: { homeworkId: homework.id, studentId: student.id, totalCount: 5, status: 'IN_PROGRESS', progress: 40 },
  });

  await prisma.notification.create({
    data: {
      userId: studentUser.id,
      type: 'HOMEWORK_ASSIGNED',
      title: 'Yangi vazifa berildi',
      message: '"Unit 3 — Daily Routines" nomli yangi uy vazifasi berildi',
    },
  });

  // eslint-disable-next-line no-console
  console.info('Seed muvaffaqiyatli yakunlandi. Login uchun:');
  // eslint-disable-next-line no-console
  console.info('  Super Admin:  +998900000001 / Password123!');
  // eslint-disable-next-line no-console
  console.info('  Filial Admin: +998900000002 / Password123!');
  // eslint-disable-next-line no-console
  console.info('  O\'qituvchi:  +998900000003 / Password123!');
  // eslint-disable-next-line no-console
  console.info('  O\'quvchi:    +998900000004 / Password123!');

  void superAdmin;
  void branchAdminUser;
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
