import { generateTestJwt } from 'test/jwt-helper';
import { createTestIdea, createTestUser } from 'test/test-helpers';
import request from 'supertest';

describe('/v1/comment (GET)', () => {
  it('should return 200 and all comments for an idea', async () => {
    // pegar ideiaId - OK
    // criar 3 usuarios, 1 sendo autor da ideia - OK
    // demais usuarios devem ser os autores dos comentarios - OK
    // criar 2 comentários - OK
    // listar comentarios da ideia - OK
    // verificar retorno, 200 OK, 2 comentarios - OK

    const user1 = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const idea = await createTestIdea(
      'Test Idea Title',
      'This is the content of the test idea',
      user1.userProfileId,
      [], // no comments at creation
    );

    const user2 = await createTestUser(
      'testuser2',
      'test2@example.com',
      'password1234',
    );
    const tokenUser2 = generateTestJwt({
      sub: user2.id,
      userProfileId: user2.userProfileId,
    });
      const user3 = await createTestUser(
      'testuser3',
      'test3@example.com',
      'password12345',
      );
      const tokenUser3 = generateTestJwt({
            sub: user3.id,
            userProfileId: user3.userProfileId,
          });

    const comment = await request(app.getHttpServer())
      .post('/v1/comment')
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({
        content: 'Comment',
        author: user2.userProfileId,
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

    const getComments = await request(app.getHttpServer())
      .get(`/v1/comment?ideaId=${idea.id}`)

      console.log('Ideas after comments:', idea)
      console.log('Get comments: ', JSON.stringify(getComments.body, null, 2));
      expect(getComments.status).toEqual(200);
      expect(getComments.body.data.length).toEqual(2);

  });
});
