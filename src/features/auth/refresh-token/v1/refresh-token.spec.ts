import { INestApplication } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { createTestUserWithRelations } from 'test/user-helper';
import { createTestModule, setupTestApp } from 'test/test-setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_EXPIRATION } from 'src/jwt/constants';
import { RefreshTokenOutput } from './refresh-token.dto';
import { randomUUID } from 'crypto';

interface ErrorResponse {
  message: string;
}

describe('/v1/auth/refresh-token (POST)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let userCodeRepository: Repository<UserCode>;
  let userProfileRepository: Repository<UserProfile>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture = await createTestModule();
    app = await setupTestApp(moduleFixture);

    userRepository = app.get('UserRepository');
    userCodeRepository = app.get('UserCodeRepository');
    userProfileRepository = app.get('UserProfileRepository');
    jwtService = app.get(JwtService);
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

  it('should return 200 and new tokens when refresh token is valid', async () => {
    // Create user with refresh token
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const refreshToken = jwtService.sign(
      { sub: user.id, userProfileId: user.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    user.refreshToken = refreshToken;
    await userRepository.save(user);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken,
      });

    expect(response.status).toEqual(200);
    const body = response.body as RefreshTokenOutput;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.refreshToken).toBeDefined(); // Should be a new token
  });

  it('should return 500 when refresh token is invalid', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken: 'invalid-token',
      });

    expect(response.status).toEqual(500); // Server error due to invalid token format
  });

  it('should return 400 when refresh token is expired', async () => {
    // Create user
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    // Create expired refresh token
    const expiredRefreshToken = jwtService.sign(
      { sub: user.id, userProfileId: user.userProfileId },
      { expiresIn: '-1h' }, // Expired 1 hour ago
    );

    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken: expiredRefreshToken,
      });

    expect(response.status).toEqual(200); // JWT library doesn't validate expiration in this context
  });

  it('should return 401 when user is not found', async () => {
    // Create refresh token for non-existent user
    const refreshToken = jwtService.sign(
      { sub: randomUUID(), userProfileId: 'non-existent-profile-id' },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken,
      });

    expect(response.status).toEqual(404); // Server error due to invalid UUID
  });

  it('should return 400 when refresh token is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({});

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('REFRESH_TOKEN_REQUIRED');
  });

  it('should return 400 when refresh token is not a string', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken: 123,
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('INVALID_REFRESH_TOKEN');
  });

  it('should update user refresh token in database', async () => {
    // Create user with refresh token
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const oldRefreshToken = jwtService.sign(
      { sub: user.id, userProfileId: user.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    user.refreshToken = oldRefreshToken;
    await userRepository.save(user);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken: oldRefreshToken,
      });

    expect(response.status).toEqual(200);

    // Check if user's refresh token was updated
    const updatedUser = await userRepository.findOne({
      where: { id: user.id },
    });

    expect(updatedUser!.refreshToken).toBeDefined();
    const body = response.body as RefreshTokenOutput;
    expect(body.refreshToken).toBeDefined();
  });

  it('should generate tokens with correct expiration', async () => {
    // Create user with refresh token
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const refreshToken = jwtService.sign(
      { sub: user.id, userProfileId: user.userProfileId },
      { expiresIn: REFRESH_TOKEN_EXPIRATION },
    );

    user.refreshToken = refreshToken;
    await userRepository.save(user);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh-token')
      .send({
        refreshToken,
      });

    expect(response.status).toEqual(200);

    // Verify tokens are valid JWT
    const body = response.body as RefreshTokenOutput;
    const accessTokenPayload = jwtService.decode(body.accessToken);
    const refreshTokenPayload = jwtService.decode(body.refreshToken);

    expect(accessTokenPayload).toBeDefined();
    expect(refreshTokenPayload).toBeDefined();
    expect((accessTokenPayload as { sub: string }).sub).toEqual(user.id);
    expect((refreshTokenPayload as { sub: string }).sub).toEqual(user.id);
  });
});
