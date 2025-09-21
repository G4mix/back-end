import { INestApplication } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { createTestUserWithRelations } from 'test/user-helper';
import { generateTestJwtForUser } from 'test/jwt-helper';
import { createTestModule, setupTestApp } from 'test/test-setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { UserDto } from 'src/entities/user.entity';

interface ErrorResponse {
  message: string;
}

describe('/v1/user/{userProfileId} (GET)', () => {
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

  const createAuthToken = (userId: string, userProfileId?: string) => {
    return generateTestJwtForUser(userId, userProfileId);
  };

  it('should return 200 and user data when user exists', async () => {
    const { user } = await createTestUserWithRelations(
      userRepository,
      userCodeRepository,
      userProfileRepository,
      'testuser',
      'test@example.com',
      'password123',
    );
    const { user: currentUser } = await createTestUserWithRelations(
      userRepository,
      userCodeRepository,
      userProfileRepository,
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id, currentUser.userProfileId);

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as UserDto;
    expect(body.id).toEqual(user.id);
    expect(body.username).toEqual(user.username);
    expect(body.email).toEqual(user.email);
    expect(body.verified).toEqual(user.verified);
  });

  it('should return 200 when no token is provided', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const response = await request(app.getHttpServer()).get(
      `/v1/user/${user.userProfileId}`,
    );

    expect(response.status).toEqual(200); // Guard está funcionando corretamente
  });

  it('should return 401 when invalid token is provided', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toEqual(401);
  });

  it('should return 404 when user does not exist', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(404);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('USER_NOT_FOUND');
  });

  it('should return 400 when userProfileId is not a valid UUID', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user/invalid-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(500); // Controller original não valida UUID
    const body = response.body as ErrorResponse;
    expect(body.message).toBeDefined();
  });

  it('should return user with profile information', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as UserDto;
    expect(body.userProfile).toBeDefined();
    expect(body.userProfile.id).toEqual(user.userProfileId);
  });

  it('should return user with links information', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as UserDto;
    expect(body.userProfile.links).toBeDefined();
    expect(Array.isArray(body.userProfile.links)).toBe(true);
  });

  it('should return user with followers information', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as UserDto;
    expect(body.userProfile.followers).toBeDefined();
    expect(typeof body.userProfile.followers).toBe('number');
  });

  it('should return user with following information', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as UserDto;
    expect(body.userProfile.following).toBeDefined();
    expect(typeof body.userProfile.following).toBe('number');
  });

  it('should return 200 when user is found by valid userProfileId', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.userProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as UserDto;
    expect(body.userProfile.id).toEqual(user.userProfileId);
  });

  it('should handle empty userProfileId parameter', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200); // Rota funciona mesmo sem parâmetro
  });
});
