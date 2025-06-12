import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function main() {
  console.log('Starting seed...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@sql.de',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.ADMIN,
    },
  });

  // Create tutor user
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Tutor',
      role: Role.TUTOR,
    },
    create: {
      email: 'tutor@sql.de',
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Tutor',
      role: Role.TUTOR,
    },
  });

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Student',
      role: Role.STUDENT,
      matriculationNumber: 'S0000000',
    },
    create: {
      email: 'student@sql.de',
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Student',
      role: Role.STUDENT,
      matriculationNumber: 'S0000000',
    },
  });

  console.log({
    message: 'Seed completed successfully',
    users: {
      admin: { email: admin.email, role: admin.role },
      tutor: { email: tutor.email, role: tutor.role },
      student: { email: student.email, role: student.role },
    }
  });
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });