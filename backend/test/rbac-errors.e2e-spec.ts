import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('RBAC and JWT Errors (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('JWT Error Messages', () => {
    it('should return 401 "Token not provided" when no token is sent', async () => {
      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .get('/auth/me')
        .expect(401);

      const body = response.body as unknown as { message: string };
      expect(body.message).toBe('Token not provided');
    });

    it('should return 401 "Invalid token" when a malformed token is sent', async () => {
      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      const body = response.body as unknown as { message: string };
      expect(body.message).toBe('Invalid token');
    });

    it('should return 401 "Token expired" when an expired token is sent', async () => {
      const expiredToken = jwtService.sign(
        { sub: '123', email: 'test@test.com', role: 'CUSTOMER' },
        { expiresIn: '-1h' },
      );

      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      const body = response.body as unknown as { message: string };
      expect(body.message).toBe('Token expired');
    });
  });

  describe('RolesGuard (RBAC)', () => {
    it('should return 403 "Access denied: insufficient role" for CUSTOMER accessing admin route', async () => {
      const customerToken = jwtService.sign({
        sub: '123',
        email: 'test@test.com',
        role: 'CUSTOMER',
      });

      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .get('/auth/admin-test')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      const body = response.body as unknown as { message: string };
      expect(body.message).toBe('Access denied: insufficient role');
    });

    it('should allow access to admin route for ADMIN user', async () => {
      const adminToken = jwtService.sign({
        sub: '456',
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const response = await request(
        app.getHttpServer() as string | (() => void),
      )
        .get('/auth/admin-test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as unknown as { message: string };
      expect(body.message).toBe('Admin access granted');
    });
  });
});
// Force CI trigger
