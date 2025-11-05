import { Comment, CommentDto } from 'src/entities/comment.entity';
import { createTestUser } from 'test/test-helpers';
import request from 'supertest';
import { generateTestJwt } from 'test/jwt-helper';
import { DeepPartial } from 'typeorm';

describe('/v1/comment (POST)', () => {
  it('should return 201 when creating a comment', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const token = generateTestJwt({
      sub: user.id,
      userProfileId: user.profileId,
    });

    const idea = await ideaRepository.save({
      authorId: user.profileId,
      title: 'titulo',
      content: 'Conteúdo',
    });

    const response = await request(app.getHttpServer())
      .post('/v1/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Comentário',
        ideaId: idea.id,
      });

    expect(response.status).toEqual(201);
    const body = response.body as CommentDto;
    expect(body.content).toBeDefined();
    expect(body.content).toEqual('Comentário');
  });

  it('should return 201 in the reply scenario', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const token = generateTestJwt({
      sub: user.id,
      userProfileId: user.profileId,
    });

    const idea = await ideaRepository.save({
      authorId: user.profileId,
      title: 'titulo',
      content: 'Conteúdo',
    });

    const comment = (await commentRepository.save({
      content: 'Conteúdo',
      authorId: user.profileId,
      ideaId: idea.id,
    } as unknown as DeepPartial<Comment>[])) as unknown as Comment;

    const response = await request(app.getHttpServer())
      .post('/v1/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Comentário',
        parentCommentId: comment.id,
        ideaId: idea.id,
      });

    expect(response.status).toEqual(201);
    const body = response.body as CommentDto;
    expect(body.content).toBeDefined();
    expect(body.content).toEqual('Comentário');
  });

  it('should return 400 if content is missing', async () => {
    const user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const token = generateTestJwt({
      sub: user.id,
      userProfileId: user.profileId,
    });

    const idea = await ideaRepository.save({
      authorId: user.profileId,
      title: 'titulo',
      content: 'Conteúdo',
    });

    const response = await request(app.getHttpServer())
      .post('/v1/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ideaId: idea.id,
      });

    expect(response.status).toEqual(400);
    const body = response.body;
    expect(body.message).toBeDefined();
  });
});
