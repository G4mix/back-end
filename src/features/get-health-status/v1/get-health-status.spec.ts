import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { setupApplication } from 'src/setup-application';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

describe('/v1/health (GET)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApplication(app);
    await app.init();
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it('should return 200 and status ok', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('should return 200 without authentication', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('should return response quickly', async () => {
    const startTime = Date.now();

    await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect({ status: 'ok' });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000); // Should respond in less than 1 second
  });

  it('should return correct content type', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect('Content-Type', /json/);
  });
});
