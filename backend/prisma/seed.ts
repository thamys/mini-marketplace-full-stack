import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@marketplace.com';
  
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    // Password: Admin@123
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        passwordHash: '$2b$10$eE6p8vAn9k9H2n0z5gYJSu6zXGvJ8uI.IqK7H8E5X.tE0kG8zE6m.', // Generated hash for Admin@123
        role: Role.ADMIN,
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
