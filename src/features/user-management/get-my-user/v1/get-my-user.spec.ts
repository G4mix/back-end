import { generateTestJwt } from 'test/jwt-helper';
import { createTestUser } from 'test/test-helpers';

import request from 'supertest';

import { ProfileDto } from 'src/entities/profile.entity';

describe('/v1/user/my-user (GET)', () => {
  it('should return 200 and current user data when authenticated', async () => {
    const currentUser = await createTestUser(
      'currentuser',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.id).toEqual(currentUser.profileId);
    expect(body.user.username).toEqual(currentUser.username);
    expect(body.user.email).toEqual(currentUser.email);
    expect(body.user.verified).toEqual(currentUser.verified);
  });

  it('should return user with profile information', async () => {
    const currentUser = await createTestUser(
      'currentuser',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.user).toBeDefined();
    expect(body.user.id).toEqual(currentUser.id);
    expect(body.displayName).toBeDefined();
  });

  it('should return user with links information', async () => {
    const currentUser = await createTestUser(
      'currentuser',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.links).toBeDefined();
    expect(Array.isArray(body.links)).toBe(true);
  });

  it('should return user with followers information', async () => {
    const currentUser = await createTestUser(
      'currentuser',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.followers).toBeDefined();
    expect(typeof body.followers).toBe('number');
  });

  it('should return user with following information', async () => {
    const currentUser = await createTestUser(
      'currentuser',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.following).toBeDefined();
    expect(typeof body.following).toBe('number');
  });

  it('should return current user with correct id', async () => {
    const user1 = await createTestUser(
      'user1',
      'user1@example.com',
      'password123',
    );
    const user2 = await createTestUser(
      'user2',
      'user2@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: user2.id,
      userProfileId: user2.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.id).toEqual(user2.profileId);
    expect(body.user.username).toEqual('user2');
    expect(body.id).not.toEqual(user1.profileId);
  });

  it('should return isFollowing as false for own profile', async () => {
    const currentUser = await createTestUser(
      'currentuser',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.profileId,
    });

    const response = await request(app.getHttpServer())
      .get('/v1/user/my-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(200);
    const body = response.body as ProfileDto;
    expect(body.isFollowing).toBe(false);
  });
});
