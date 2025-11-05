import { generateTestJwt } from 'test/jwt-helper';
import { createTestIdea, createTestUser } from 'test/test-helpers';
import request from 'supertest';

describe('/v1/comment (GET)', () => {
  it('should return 200 and all comments for an idea', async () => {
    const user1 = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const idea = await createTestIdea(
      'Test Idea Title',
      'This is the content of the test idea',
      user1.profileId,
      [], // no comments at creation
    );

    const user2 = await createTestUser(
      'testuser2',
      'test2@example.com',
      'password1234',
    );
    const tokenUser2 = generateTestJwt({
      sub: user2.id,
      userProfileId: user2.profileId,
    });
    const user3 = await createTestUser(
      'testuser3',
      'test3@example.com',
      'password12345',
    );
    const tokenUser3 = generateTestJwt({
      sub: user3.id,
      userProfileId: user3.profileId,
    });

    await request(app.getHttpServer())
      .post('/v1/comment')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({
        content: 'Comment',
        ideaId: idea.id,
      });

    // 1 comentário do user3
    await request(app.getHttpServer())
      .post('/v1/comment')
      .set('Authorization', `Bearer ${tokenUser3}`)
      .send({
        content: 'Comment 2',
        ideaId: idea.id,
      });

    const response = await request(app.getHttpServer()).get(
      `/v1/comment?ideaId=${idea.id}`,
    );

    expect(response.status).toEqual(200);
    expect(response.body.data.length).toEqual(2);
  });

  it('should return 400 when idea id is invalid', async () => {
    const ideaId = '1';
    const response = await request(app.getHttpServer()).get(
      `/v1/comment?ideaId=${ideaId}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.data).toBeUndefined();
    expect(response.body.message).toContain('INVALID_IDEA_ID');
  });

  it('should return 404 when ideaId does not exist', async () => {
    const ideaId = '1e9c20a4-3f8d-4b71-8c0e-92a15f0b6d2c';
    const response = await request(app.getHttpServer()).get(
      `/v1/comment?ideaId=${ideaId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('IDEA_NOT_FOUND');
  });
});
