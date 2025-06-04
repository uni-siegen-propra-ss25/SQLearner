import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Users
  const adminPassword = await bcrypt.hash('adminpwtest', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@markt.de' },
    update: {
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      matriculationNumber: 'A0000000',
    },
    create: {
      email: 'admin@markt.de',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      matriculationNumber: 'A0000000',
    },
  });
  

  console.log({admin,});
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });