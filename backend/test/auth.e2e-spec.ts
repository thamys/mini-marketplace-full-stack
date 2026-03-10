import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({
      where: { email: 'e2e@test.com' },
    });
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('TC-E2E-B01: should register a new user (201)', async () => {
      const payload = {
        name: 'E2E User',
        email: 'e2e@test.com',
        password: 'password123',
      };

      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .post('/auth/register')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toEqual(
        expect.objectContaining({
          email: payload.email,
          name: payload.name,
        }),
      );
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('TC-E2E-B02: should return 409 if email already exists', async () => {
      const payload = {
        name: 'E2E User',
        email: 'e2e@test.com',
        password: 'password123',
      };

      await request(app.getHttpServer() as string | (() => void))
        .post('/auth/register')
        .send(payload)
        .expect(409);
    });

    it('TC-E2E-B03: should return 400 for invalid payload', async () => {
      const payload = {
        name: 'U', // Too short
        email: 'invalid-email',
        password: 'short',
      };

      await request(app.getHttpServer() as string | (() => void))
        .post('/auth/register')
        .send(payload)
        .expect(400);
    });
  });
});
