import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create a mock user for tokens
    adminToken = jwtService.sign({ sub: 'admin-id', email: 'admin@test.com', role: Role.ADMIN });
    customerToken = jwtService.sign({ sub: 'customer-id', email: 'customer@test.com', role: Role.CUSTOMER });

    // Clean up products
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await prisma.product.deleteMany();
    await app.close();
  });

  describe('POST /products', () => {
    it('TC-09.2.1: POST com token ADMIN + payload válido → 201', async () => {
      const payload = {
        name: 'Product E2E',
        description: 'Description',
        price: 100,
        category: 'Electronics',
        stock: 10,
        imageUrl: 'http://test.com/img.jpg',
      };

      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      const body = response.body as { name: string; price: string };
      expect(body.name).toBe(payload.name);
      expect(body.price).toBe('100'); // Prisma Decimal is returned as string
    });

    it('TC-09.2.2: POST com payload inválido → 400 com erros por campo', async () => {
      const payload = {
        name: '',
        price: -10,
      };

      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      const body = response.body as { message: string, errors: Record<string, string[]> };
      expect(body.message).toBe('Validation failed');
      expect(body.errors).toHaveProperty('name');
      expect(body.errors).toHaveProperty('price');
    });

    it('TC-09.2.3: POST com token CUSTOMER → 403', async () => {
      const payload = {
        name: 'Fail Product',
        description: 'Desc',
        price: 10,
        category: 'Cat',
        stock: 1,
      };

      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /products/:id', () => {
    it('TC-09.2.4: PUT com id válido + token ADMIN → 200 com produto atualizado', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'To Update',
          description: 'Desc',
          price: 50,
          category: 'Cat',
          stock: 5,
        },
      });

      const updatePayload = { price: 75 };

      const response = await request(app.getHttpServer() as string | (() => void))
        .put(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      if (response.status !== 200) {
        console.log('PUT FAIL BODY:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      const body = response.body as { price: string };
      expect(body.price).toBe('75');
    });
  });

  describe('DELETE /products/:id', () => {
    it('TC-09.2.5: DELETE com id válido + token ADMIN → 204', async () => {
      const product = await prisma.product.create({
        data: {
          name: 'To Delete',
          description: 'Desc',
          price: 50,
          category: 'Cat',
          stock: 5,
        },
      });

      const response = await request(app.getHttpServer() as string | (() => void))
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
      
      const deletedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(deletedProduct).toBeNull();
    });
  });
});
