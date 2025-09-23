import { INestApplication } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { createTestUserWithRelations } from 'test/user-helper';
import { createTestModule, setupTestApp } from 'test/test-setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { SigninOutput } from './signin.dto';

interface ErrorResponse {
  message: string;
}

describe('/v1/auth/signin (POST)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let userCodeRepository: Repository<UserCode>;
  let userProfileRepository: Repository<UserProfile>;

  beforeEach(async () => {
    const moduleFixture = await createTestModule();
    app = await setupTestApp(moduleFixture);

    userRepository = app.get('UserRepository');
    userCodeRepository = app.get('UserCodeRepository');
    userProfileRepository = app.get('UserProfileRepository');
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  const createTestUser = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const { user } = await createTestUserWithRelations(
      userRepository,
      userCodeRepository,
      userProfileRepository,
      username,
      email,
      password,
    );
    return user;
  };

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
    expect(body.user).toBeDefined();
    expect(body.user.email).toEqual('test@example.com');
  });

  it('should return 401 when user is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(response.status).toEqual(404);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('USER_NOT_FOUND');
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
    expect(body.message).toEqual('WRONG_PASSWORD_ONCE');
  });

  it('should return 400 with specific error messages for multiple wrong attempts', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'correctpassword',
    );
    user.loginAttempts = 3;
    await userRepository.save(user);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toEqual('WRONG_PASSWORD_FOUR_TIMES');
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
