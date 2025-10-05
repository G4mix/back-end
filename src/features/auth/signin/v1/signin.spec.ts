import request from 'supertest';
import { SigninOutput } from './signin.dto';
import { createTestUser } from 'test/test-helpers';

interface ErrorResponse {
  message: string;
}

describe('/v1/auth/signin (POST)', () => {
  it('should return 200 and tokens when credentials are valid', async () => {
    await createTestUser('testuser', 'test@example.com', 'password123');

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toEqual(200);
    const body = response.body as SigninOutput;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.userProfile).toBeDefined();
    expect(body.userProfile.user.email).toEqual('test@example.com');
  });

  it('should return 401 when user is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('INVALID_EMAIL_OR_PASSWORD');
  });

  it('should return 400 when password is incorrect', async () => {
    await createTestUser('testuser', 'test@example.com', 'correctpassword');

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toEqual('INVALID_EMAIL_OR_PASSWORD');
  });

  it('should return 429 when account is blocked due to too many attempts', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'correctpassword',
    );
    const blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    user.loginAttempts = 5;
    user.blockedUntil = blockedUntil;
    await userRepository.save(user);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'correctpassword',
      });

    expect(response.status).toEqual(429);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('TOO_MANY_LOGIN_ATTEMPTS');
  });

  it('should validate required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({});

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('EMAIL_REQUIRED');
    expect(body.message).toContain('PASSWORD_REQUIRED');
  });

  it('should validate email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'invalid-email',
        password: 'password123',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('INVALID_EMAIL');
  });
});
