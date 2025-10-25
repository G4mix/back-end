import { createTestUser } from 'test/test-helpers';
import { generateTestJwt } from 'test/jwt-helper';

import request from 'supertest';

import { ProfileDto } from 'src/entities/profile.entity';

interface ErrorResponse {
  message: string;
}

describe('/v1/user/{userProfileId} (GET)', () => {
  it('should return 200 and user data when user exists', async () => {
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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.id).toEqual(user.profileId);
    expect(body.user.username).toEqual(user.username);
    expect(body.user.email).toEqual(user.email);
    expect(body.user.verified).toEqual(user.verified);
  });

  it('should return 200 when no token is provided', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const response = await request(app.getHttpServer()).get(
      `/v1/user/${user.profileId}`,
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
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toEqual(401);
  });

  it('should return 404 when user does not exist', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/invalid-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(400); // Controller original não valida UUID
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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.user).toBeDefined();
    expect(body.user.id).toEqual(user.id);
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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.links).toBeDefined();
    expect(Array.isArray(body.links)).toBe(true);
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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.followers).toBeDefined();
    expect(typeof body.followers).toBe('number');
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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.following).toBeDefined();
    expect(typeof body.following).toBe('number');
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
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/user/${user.profileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.id).toEqual(user.profileId);
  });

  it('should handle empty userProfileId parameter', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200); // Rota funciona mesmo sem parâmetro
  });
});
