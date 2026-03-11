import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@marketplace.com';
  
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const password = 'Admin@123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log(`Created admin user: ${admin.id}`);
  } else {
    console.log(`Admin user already exists: ${existingUser.id}`);
  }

  console.log('Resetting products table...');
  await prisma.product.deleteMany({});

  console.log('Seeding 100 products...');

  const categories = ['Eletrônicos', 'Móveis', 'Informática', 'Eletrodomésticos', 'Esportes', 'Livros'];
  
  // Specific products to fulfill the Acceptance Criteria
  const baseProducts = [
    { name: 'Notebook Dell XPS 15', category: 'Informática', price: 12500.50 },
    { name: 'Smartphone Samsung Galaxy S23', category: 'Eletrônicos', price: 4999.00 },
    { name: 'Notebook Apple MacBook Pro', category: 'Informática', price: 18999.00 },
    { name: 'Smart TV LG OLED 65"', category: 'Eletrônicos', price: 8500.00 },
    { name: 'Sofá Retrátil 3 Lugares', category: 'Móveis', price: 2100.00 },
    { name: 'Mesa de Escritório em L', category: 'Móveis', price: 850.00 },
    { name: 'Bicicleta Ergométrica', category: 'Esportes', price: 1200.00 },
    { name: 'Geladeira Brastemp Frost Free', category: 'Eletrodomésticos', price: 3400.00 },
    { name: 'Micro-ondas Electrolux 31L', category: 'Eletrodomésticos', price: 650.00 },
    { name: 'Livro: O Senhor dos Anéis', category: 'Livros', price: 120.00 },
  ];

  const productsToCreate = Array.from({ length: 100 }).map((_, index) => {
    // For the first 10, use baseProducts
    const baseProduct = index < baseProducts.length ? baseProducts[index] : {
      name: `Produto Fictício ${index + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 5000) + 100,
    };

    return {
      name: baseProduct.name,
      description: `Descrição completa do ${baseProduct.name}. Produto de alta qualidade para atender às suas necessidades diárias.`,
      price: baseProduct.price,
      category: baseProduct.category,
      stock: Math.floor(Math.random() * 50) + 1,
      imageUrl: `https://placehold.co/600x600?text=${encodeURIComponent(baseProduct.name)}`,
    };
  });

  await prisma.product.createMany({
    data: productsToCreate,
  });

  console.log('Successfully seeded 100 products.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
