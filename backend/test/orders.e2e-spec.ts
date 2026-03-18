import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { productPayload } from './helpers/factories';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let customerToken: string;
  let customer2Token: string;
  let testProductId: string;
  let customerId: string;
  let customer2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Limpar dados anteriores
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany({ where: { name: { startsWith: '[E2E-Orders]' } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@orders-e2e.test' } } });

    // Criar usuários reais no banco (FK obrigatória em Order.userId)
    const hash = await bcrypt.hash('password123', 10);
    const customer = await prisma.user.create({
      data: { name: 'Customer E2E', email: 'customer@orders-e2e.test', passwordHash: hash, role: Role.CUSTOMER },
    });
    const customer2 = await prisma.user.create({
      data: { name: 'Customer2 E2E', email: 'customer2@orders-e2e.test', passwordHash: hash, role: Role.CUSTOMER },
    });
    customerId = customer.id;
    customer2Id = customer2.id;

    adminToken = jwtService.sign({
      sub: 'admin-orders-fixed-id',
      email: 'admin-orders@orders-e2e.test',
      role: Role.ADMIN,
    });
    customerToken = jwtService.sign({
      sub: customerId,
      email: customer.email,
      role: Role.CUSTOMER,
    });
    customer2Token = jwtService.sign({
      sub: customer2Id,
      email: customer2.email,
      role: Role.CUSTOMER,
    });

    // Criar produto de teste com estoque suficiente
    const testProduct = await prisma.product.create({
      data: productPayload({ name: '[E2E-Orders] Produto Teste', price: 100, stock: 50 }),
    });
    testProductId = testProduct.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.orderItem.deleteMany();
      await prisma.order.deleteMany();
      await prisma.product.deleteMany({ where: { name: { startsWith: '[E2E-Orders]' } } });
      await prisma.user.deleteMany({ where: { email: { endsWith: '@orders-e2e.test' } } });
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /orders', () => {
    it('TC-12.E2E.1: customer + itens válidos → 201 com pedido e items', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ productId: testProductId, quantity: 2 }] });

      expect(response.status).toBe(201);
      const body = response.body as {
        id: string;
        items: { productName: string; unitPrice: string; quantity: number }[];
      };
      expect(body.id).toBeDefined();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].productName).toBe('[E2E-Orders] Produto Teste');
      expect(body.items[0].unitPrice).toBe('100'); // Prisma Decimal serializado como string
    });

    it('TC-12.E2E.2: customer + estoque insuficiente → 400 com INSUFFICIENT_STOCK e details', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ productId: testProductId, quantity: 9999 }] });

      expect(response.status).toBe(400);
      const body = response.body as {
        error: string;
        details: { productId: string; requested: number; available: number }[];
      };
      expect(body.error).toBe('INSUFFICIENT_STOCK');
      expect(body.details).toHaveLength(1);
      expect(body.details[0].productId).toBe(testProductId);
      expect(body.details[0].requested).toBe(9999);
      expect(body.details[0].available).toBeGreaterThanOrEqual(0);
    });

    it('TC-12.E2E.3: customer + productId inexistente → 400', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ productId: 'non-existent-product-id', quantity: 1 }] });

      expect(response.status).toBe(400);
    });

    it('TC-12.E2E.4: admin tentando criar pedido → 403', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [{ productId: testProductId, quantity: 1 }] });

      expect(response.status).toBe(403);
    });

    it('TC-12.E2E.5: sem token → 401', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .send({ items: [{ productId: testProductId, quantity: 1 }] });

      expect(response.status).toBe(401);
    });

    it('TC-12.E2E.6: estoque é decrementado após criação bem-sucedida', async () => {
      // Produto dedicado com estoque inicial conhecido
      const stockProduct = await prisma.product.create({
        data: productPayload({ name: '[E2E-Orders] Stock Test', price: 50, stock: 5 }),
      });

      await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ productId: stockProduct.id, quantity: 2 }] })
        .expect(201);

      const updatedProduct = await prisma.product.findUnique({ where: { id: stockProduct.id } });
      expect(updatedProduct!.stock).toBe(3);
    });
  });

  describe('GET /orders', () => {
    it('TC-12.E2E.7: admin vê todos os pedidos com user info', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .get('/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const body = response.body as {
        id: string;
        user: { id: string; email: string; name: string };
      }[];
      expect(Array.isArray(body)).toBe(true);
      // Pedidos criados nos testes anteriores devem ter user.email
      const ordersWithUser = body.filter((o) => o.user);
      expect(ordersWithUser.length).toBeGreaterThan(0);
      expect(ordersWithUser[0].user.email).toBeDefined();
    });

    it('TC-12.E2E.8: customer vê apenas os seus próprios pedidos', async () => {
      // Garantir que customer2 tem pelo menos um pedido
      await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ items: [{ productId: testProductId, quantity: 1 }] })
        .expect(201);

      const customer1Response = await request(app.getHttpServer() as string | (() => void))
        .get('/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(customer1Response.status).toBe(200);
      const orders = customer1Response.body as { userId: string }[];
      // Todos os pedidos retornados pertencem ao customer1
      for (const order of orders) {
        expect(order.userId).toBe(customerId);
      }
    });

    it('TC-12.E2E.9: sem token → 401', async () => {
      const response = await request(app.getHttpServer() as string | (() => void)).get('/orders');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    let createdOrderId: string;

    beforeEach(async () => {
      // Cria um pedido fresco para cada teste de status
      const res = await request(app.getHttpServer() as string | (() => void))
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ productId: testProductId, quantity: 1 }] })
        .expect(201);

      createdOrderId = (res.body as { id: string }).id;
    });

    it('TC-12.E2E.10: admin + status válido → 200 com pedido atualizado', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .patch(`/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      const body = response.body as { status: string };
      expect(body.status).toBe('COMPLETED');
    });

    it('TC-12.E2E.11: admin + ID inválido → 404', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .patch('/orders/non-existent-order-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(404);
    });

    it('TC-12.E2E.12: customer tentando atualizar status → 403', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .patch(`/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(403);
    });

    it('TC-12.E2E.13: sem token → 401', async () => {
      const response = await request(app.getHttpServer() as string | (() => void))
        .patch(`/orders/${createdOrderId}/status`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(401);
    });
  });
});
