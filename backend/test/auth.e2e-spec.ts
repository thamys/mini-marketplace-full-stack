import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      prisma = moduleFixture.get<PrismaService>(PrismaService);
      await app.init();
    } catch (error) {
      console.error('FAILED TO INITIALIZE E2E APP:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup test user
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: 'e2e@test.com' },
      });
    }
    if (app) {
      await app.close();
    }
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

      const body = response.body as unknown as {
        access_token: string;
        user: { id: string; email: string; name: string; role: string };
      };
      expect(body.user).toHaveProperty('id');
      expect(body).toHaveProperty('access_token');
      expect(body.user).toEqual(
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

  describe('/auth/login (POST)', () => {
    beforeAll(async () => {
      // Ensure test user exists for login tests
      await prisma.user.upsert({
        where: { email: 'e2e@test.com' },
        update: {},
        create: {
          name: 'E2E User',
          email: 'e2e@test.com',
          passwordHash:
            '$2b$10$EPf9avv.WnJ7FmS6mHhO.uWx6lJmG2zQzFz0zFz0zFz0zFz0zFz0z', // "password123"
        },
      });
    });

    it('TC-E2E-B04: should login successfully (200)', async () => {
      const payload = {
        email: 'e2e@test.com',
        password: 'password123',
      };

      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .post('/auth/login')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      const body = response.body as unknown as { user: { email: string } };
      expect(body.user).toEqual(
        expect.objectContaining({
          email: payload.email,
        }),
      );
    });

    it('TC-E2E-B05: should return 401 for wrong password', async () => {
      const payload = {
        email: 'e2e@test.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer() as string | (() => void))
        .post('/auth/login')
        .send(payload)
        .expect(401);
    });

    it('TC-E2E-B06: should return 401 for non-existent user', async () => {
      const payload = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      await request(app.getHttpServer() as string | (() => void))
        .post('/auth/login')
        .send(payload)
        .expect(401);
    });
  });
});
