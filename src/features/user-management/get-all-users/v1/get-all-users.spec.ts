import { User } from 'src/entities/user.entity';
import request from 'supertest';
import { GetAllUsersOutput } from './get-all-users.dto';
import { createTestUser } from 'test/user-helper';
import { generateTestJwt } from 'test/jwt-helper';

describe('/v1/user (GET)', () => {
  it('should return 200 and list users with pagination', async () => {
    // Create test users
    await createTestUser('user1', 'user1@example.com', 'password123');
    await createTestUser('user2', 'user2@example.com', 'password123');
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );

    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

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
    await createTestUser('john_doe', 'john@example.com', 'password123');
    await createTestUser('jane_smith', 'jane@example.com', 'password123');
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );

    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user?search=john')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.data).toHaveLength(1);
    expect(body.data[0].user.username).toEqual('john_doe');
  });

  it('should return 200 with empty search results', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user?page=-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(400);
    expect(response.body.message).toContain('INVALID_PAGE');
  });

  it('should return 400 when quantity is not a number', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user?quantity=invalid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(400);
  });

  it('should return 400 when quantity is zero or negative', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user?quantity=0')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(400);
    expect(response.body.message).toContain('INVALID_QUANTITY');
  });

  it('should use default values when parameters are not provided', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as GetAllUsersOutput;
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toEqual(otherUser.userProfileId);
    expect(body.data[0].id).not.toEqual(currentUser.userProfileId);
  });
});
