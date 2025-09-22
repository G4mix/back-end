import { INestApplication } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { UserCode } from 'src/entities/user-code.entity';
import { UserProfile } from 'src/entities/user-profile.entity';
import { Follow } from 'src/entities/follow.entity';
import { createTestUserWithRelations } from 'test/user-helper';
import { generateTestJwtForUser } from 'test/jwt-helper';
import { createTestModule, setupTestApp } from 'test/test-setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';

describe('/v1/follow (POST)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let userCodeRepository: Repository<UserCode>;
  let userProfileRepository: Repository<UserProfile>;
  let followRepository: Repository<Follow>;

  beforeEach(async () => {
    const moduleFixture = await createTestModule();
    app = await setupTestApp(moduleFixture);

    userRepository = app.get('UserRepository');
    userCodeRepository = app.get('UserCodeRepository');
    userProfileRepository = app.get('UserProfileRepository');
    followRepository = app.get('FollowRepository');
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

  it('should return 204 and create follow relationship successfully', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const targetUser = await createTestUser(
      'target',
      'target@example.com',
      'password123',
    );
    const token = createAuthToken(follower.id, follower.userProfileId);

    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });

    expect(response.status).toEqual(204);

    // Verify follow relationship was created
    const follow = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });
    expect(follow).toBeDefined();
  });

  it('should return 204 and remove follow relationship when already following', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const targetUser = await createTestUser(
      'target',
      'target@example.com',
      'password123',
    );

    // Create existing follow relationship
    await followRepository.save({
      followerUserId: follower.userProfileId,
      followingUserId: targetUser.userProfileId,
    });

    const token = createAuthToken(follower.id, follower.userProfileId);

    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });

    expect(response.status).toEqual(204);

    // Verify follow relationship was removed
    const follow = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });
    expect(follow).toBeNull();
  });

  it('should return 400 when trying to follow yourself', async () => {
    const user = await createTestUser(
      'user',
      'user@example.com',
      'password123',
    );
    const token = createAuthToken(user.id, user.userProfileId);

    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: user.userProfileId, // Same as current user
      });

    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual('YOU_CANNOT_FOLLOW_YOURSELF');
  });

  it('should return 404 when target user does not exist', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const token = createAuthToken(follower.id, follower.userProfileId);

    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent user
      });

    expect(response.status).toEqual(404);
    expect(response.body.message).toEqual('USER_NOT_FOUND');
  });

  it('should return 400 when targetUserId is not provided', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const token = createAuthToken(follower.id, follower.userProfileId);

    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toEqual(400);
  });

  it('should return 400 when targetUserId is not a valid UUID', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const token = createAuthToken(follower.id, follower.userProfileId);

    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: 'invalid-uuid',
      });

    expect(response.status).toEqual(400);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .send({
        targetUserId: 'some-user-id',
      });

    expect(response.status).toEqual(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', 'Bearer invalid-token')
      .send({
        targetUserId: 'some-user-id',
      });

    expect(response.status).toEqual(401);
  });

  it('should handle multiple follow/unfollow cycles correctly', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const targetUser = await createTestUser(
      'target',
      'target@example.com',
      'password123',
    );
    const token = createAuthToken(follower.id, follower.userProfileId);

    // First follow
    let response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Verify follow exists
    let follow = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });
    expect(follow).toBeDefined();

    // Unfollow
    response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Verify follow was removed
    follow = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });
    expect(follow).toBeNull();

    // Follow again
    response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Verify follow exists again
    follow = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });
    expect(follow).toBeDefined();
  });

  it('should handle multiple users following the same target', async () => {
    const follower1 = await createTestUser(
      'follower1',
      'follower1@example.com',
      'password123',
    );
    const follower2 = await createTestUser(
      'follower2',
      'follower2@example.com',
      'password123',
    );
    const targetUser = await createTestUser(
      'target',
      'target@example.com',
      'password123',
    );

    const token1 = createAuthToken(follower1.id, follower1.userProfileId);
    const token2 = createAuthToken(follower2.id, follower2.userProfileId);

    // First user follows target
    let response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Second user follows target
    response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        targetUserId: targetUser.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Verify both follows exist
    const follow1 = await followRepository.findOne({
      where: {
        followerUserId: follower1.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });
    const follow2 = await followRepository.findOne({
      where: {
        followerUserId: follower2.userProfileId,
        followingUserId: targetUser.userProfileId,
      },
    });

    expect(follow1).toBeDefined();
    expect(follow2).toBeDefined();
    expect(follow1?.id).not.toEqual(follow2?.id);
  });

  it('should handle one user following multiple targets', async () => {
    const follower = await createTestUser(
      'follower',
      'follower@example.com',
      'password123',
    );
    const target1 = await createTestUser(
      'target1',
      'target1@example.com',
      'password123',
    );
    const target2 = await createTestUser(
      'target2',
      'target2@example.com',
      'password123',
    );

    const token = createAuthToken(follower.id, follower.userProfileId);

    // Follow first target
    let response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: target1.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Follow second target
    response = await request(app.getHttpServer())
      .post('/v1/follow')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetUserId: target2.userProfileId,
      });
    expect(response.status).toEqual(204);

    // Verify both follows exist
    const follow1 = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: target1.userProfileId,
      },
    });
    const follow2 = await followRepository.findOne({
      where: {
        followerUserId: follower.userProfileId,
        followingUserId: target2.userProfileId,
      },
    });

    expect(follow1).toBeDefined();
    expect(follow2).toBeDefined();
    expect(follow1?.id).not.toEqual(follow2?.id);
  });
});
