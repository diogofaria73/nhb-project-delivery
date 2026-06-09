import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@platform.com';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  await prisma.user.create({
    data: {
      name: 'Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMINISTRATOR',
      isActive: true,
    },
  });

  console.log(`Seed completed: Admin user created (${adminEmail})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
