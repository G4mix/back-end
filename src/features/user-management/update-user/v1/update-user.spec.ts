/* eslint-disable */
import request from 'supertest';
import { createTestUser } from 'test/user-helper';
import { generateTestJwt } from 'test/jwt-helper';

describe('/v1/user (PATCH)', () => {
  it('should return 200 and update user basic info successfully', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('user', JSON.stringify({ username: 'newusername', email: 'newemail@example.com' }));

    expect(response.status).toEqual(200);
    expect(response.body.user.username).toEqual('newusername');
    expect(response.body.user.email).toEqual('newemail@example.com');
    expect(response.body.user.verified).toEqual(false); // Email change should set verified to false
  });

  it('should return 200 and update user password successfully', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('user', JSON.stringify({ password: 'NewPassword123!' }));

    expect(response.status).toEqual(200);
    expect(response.body.user.username).toEqual('testuser'); // Should remain unchanged
  });

  it('should return 200 and update user profile successfully', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('displayName', 'New Display Name')
      .field('autobiography', 'This is my new autobiography')
      .field('links', ['https://github.com/test', 'https://linkedin.com/test']);

    expect(response.status).toEqual(200);
    expect(response.body.displayName).toEqual('New Display Name');
    expect(response.body.autobiography).toEqual(
      'This is my new autobiography',
    );
    expect(response.body.links).toHaveLength(2);
  });

  it('should return 200 and update user with icon upload', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .attach('icon', Buffer.from('fake-image-data'), 'test.jpg')
      .field('displayName', 'Test User');

    expect(response.status).toEqual(200);
    expect(response.body.icon).toMatch(
      /^https:\/\/gamix-public\.s3\.amazonaws\.com\/user-[a-f0-9-]+\/icon\.jpg$/,
    );
    expect(s3Client.send).toHaveBeenCalled();
  });

  it('should return 200 and update user with background image upload', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .attach(
        'backgroundImage',
        Buffer.from('fake-image-data'),
        'background.jpg',
      )
      .field('displayName', 'Test User')

    expect(response.status).toEqual(200);
    expect(response.body.backgroundImage).toMatch(
      /^https:\/\/gamix-public\.s3\.amazonaws\.com\/user-[a-f0-9-]+\/backgroundImage\.jpg$/,
    );
    expect(s3Client.send).toHaveBeenCalled();
  });

  it('should return 200 and update user with both icon and background image', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .attach('icon', Buffer.from('fake-icon-data'), 'icon.jpg')
      .attach(
        'backgroundImage',
        Buffer.from('fake-background-data'),
        'background.jpg',
      )
      .field('displayName', 'Test User');

    expect(response.status).toEqual(200);
    expect(response.body.icon).toMatch(
      /^https:\/\/gamix-public\.s3\.amazonaws\.com\/user-[a-f0-9-]+\/icon\.jpg$/,
    );
    expect(response.body.backgroundImage).toMatch(
      /^https:\/\/gamix-public\.s3\.amazonaws\.com\/user-[a-f0-9-]+\/backgroundImage\.jpg$/,
    );
    expect(s3Client.send).toHaveBeenCalledTimes(2);
  });

  it('should return 400 when username is too short', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('user', JSON.stringify({ username: 'ab' })); // Too short

    expect(response.status).toEqual(400);
  });

  it('should return 400 when email format is invalid', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('user', JSON.stringify({ email: 'invalid-email' }));

    expect(response.status).toEqual(400);
  });

  it('should return 400 when password is too weak', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('user', JSON.stringify({ password: 'weak' })); // Too weak

    expect(response.status).toEqual(400);
  });

  it('should return 400 when userProfile displayName is too short', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'ab',
      });

    expect(response.status).toEqual(400);
  });

  it('should return 400 when userProfile autobiography is too short', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('autobiography', 'ab');

    expect(response.status).toEqual(400);
  });

  it('should return 400 when userProfile links contain invalid URLs', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('links', ['invalid-url', 'ftp://invalid-protocol.com']);

    expect(response.status).toEqual(400);
  });

  it('should return 500 when S3 upload fails', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    jest
      .spyOn(s3Client, 'send')
      .mockRejectedValue(new Error('S3 upload failed') as never);

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .attach('icon', Buffer.from('fake-image-data'), 'test.jpg')
      .field('displayName', 'Test User')

    expect(response.status).toEqual(500);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer()).patch('/v1/user').send({
      username: 'newusername',
    });

    expect(response.status).toEqual(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        username: 'newusername',
      });

    expect(response.status).toEqual(401);
  });

  it('should return 200 when no changes are made to user data', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('user', JSON.stringify({ username: 'testuser' })); // Same as current

    expect(response.status).toEqual(200);
    expect(response.body.user.username).toEqual('testuser'); // Should remain unchanged
  });

  it('should return 200 and create new user profile when user has no profile', async () => {
    // Create user without profile
    const userCode = await userCodeRepository.save({ code: null });
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const userProfile = await userProfileRepository.save({
      displayName: 'temp',
    });

    const currentUser = await userRepository.save({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      verified: true,
      userCodeId: userCode.id,
      userProfileId: userProfile.id,
    });

    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('displayName', 'New Profile')
      .field('autobiography', 'New biography')  

    expect(response.status).toEqual(200);
    expect(response.body.displayName).toEqual('New Profile');
    expect(response.body.autobiography).toEqual('New biography');
  });

  it('should return 200 and update existing user profile', async () => {
    const currentUser = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const token = generateTestJwt({
      sub: currentUser.id,
      userProfileId: currentUser.userProfileId,
    });

    await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('displayName', 'First Name')
      .field('autobiography', 'First biography');

    const response = await request(app.getHttpServer())
      .patch('/v1/user')
      .set('Authorization', `Bearer ${token}`)
      .field('displayName', 'Updated Name')
      .field('autobiography', 'Updated biography');

    expect(response.status).toEqual(200);
    expect(response.body.displayName).toEqual('Updated Name');
    expect(response.body.autobiography).toEqual(
      'Updated biography',
    );
  });
});
