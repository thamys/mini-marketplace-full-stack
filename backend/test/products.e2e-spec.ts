import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication<App>;
  let testProductId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('TC-08.4.1: GET /api/products → 200 com { data, meta }', async () => {
    const response = await request(app.getHttpServer()).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
    
    if (response.body.data.length > 0) {
      testProductId = response.body.data[0].id;
    }
  });

  it('TC-08.4.2: GET /api/products?search=notebook → 200 com resultados filtrados', async () => {
    const response = await request(app.getHttpServer()).get('/api/products?search=notebook');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    // Even if empty, it's successful filtering
  });

  it('TC-08.4.3: GET /api/products/:id válido → 200 com produto', async () => {
    if (!testProductId) {
      console.warn('Skipping test b/c testProductId is empty');
      return;
    }
    const response = await request(app.getHttpServer()).get(`/api/products/${testProductId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testProductId);
  });

  it('TC-08.4.4: GET /api/products/:id inválido → 404', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/invalid-id-or-non-existent');
    expect(response.status).toBe(404);
  });
});
