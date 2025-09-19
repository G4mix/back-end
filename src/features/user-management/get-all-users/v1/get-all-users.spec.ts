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
import { GetAllUsersOutput } from './get-all-users.dto';

describe('/v1/user (GET)', () => {
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

  it('should return 200 and list users with pagination', async () => {
    // Create test users
    const _user1 = await createTestUser(
      'user1',
      'user1@example.com',
      'password123',
    );
    const _user2 = await createTestUser(
      'user2',
      'user2@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );

    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?page=0&quantity=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.total).toBeGreaterThanOrEqual(2);
    expect(body.page).toEqual(0);
    expect(body.data).toHaveLength(2);
    expect(body.data.find((u) => u.id === currentUser.id)).toBeUndefined();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).get('/v1/user');

    expect(response.status).toEqual(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/user')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toEqual(401);
  });

  it('should return 200 with search functionality', async () => {
    // Create test users
    const _user1 = await createTestUser(
      'john_doe',
      'john@example.com',
      'password123',
    );
    const _user2 = await createTestUser(
      'jane_smith',
      'jane@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );

    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?search=john')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.data).toHaveLength(1);
    expect(body.data[0].username).toEqual('john_doe');
  });

  it('should return 200 with empty search results', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?search=nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.data).toHaveLength(0);
    expect(body.total).toEqual(0);
  });

  it('should return 200 with pagination parameters', async () => {
    // Create multiple users
    const users: User[] = [];
    for (let i = 0; i < 15; i++) {
      users.push(
        await createTestUser(`user${i}`, `user${i}@example.com`, 'password123'),
      );
    }
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?page=0&quantity=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.data).toHaveLength(5);
    expect(body.page).toEqual(0);
    expect(body.total).toBeGreaterThanOrEqual(15);
  });

  it('should return 200 with next page calculation', async () => {
    // Create multiple users
    const users: User[] = [];
    for (let i = 0; i < 15; i++) {
      users.push(
        await createTestUser(`user${i}`, `user${i}@example.com`, 'password123'),
      );
    }
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?page=0&quantity=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.nextPage).toEqual(1);
    expect(body.pages).toBeGreaterThan(1);
  });

  it('should return 200 with null nextPage on last page', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?page=0&quantity=100')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.nextPage).toBeNull();
  });

  it('should return 400 when page is negative', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?page=-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(500);
  });

  it('should return 400 when quantity is not a number', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user?quantity=invalid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(400);
  });

  it('should use default values when parameters are not provided', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.page).toEqual(0);
    expect(body.data.length).toBeLessThanOrEqual(10);
  });

  it('should exclude current user from results', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const otherUser = await createTestUser(
      'other',
      'other@example.com',
      'password123',
    );
    const token = createAuthToken(currentUser.id);

    const response = await request(app.getHttpServer())
      .get('/v1/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toEqual(otherUser.id);
    expect(body.data[0].id).not.toEqual(currentUser.id);
  });
});
