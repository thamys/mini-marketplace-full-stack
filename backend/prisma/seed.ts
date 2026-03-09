import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@marketplace.com';
  
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
      },
    });
    console.log(`Created admin user: ${admin.id}`);
  } else {
    console.log(`Admin user already exists: ${existingUser.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
