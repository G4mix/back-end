import request from 'supertest';

describe('/v1/health (GET)', () => {
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
