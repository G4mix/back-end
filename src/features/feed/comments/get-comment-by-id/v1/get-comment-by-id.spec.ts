import { Comment, CommentDto } from 'src/entities/comment.entity';
import { Idea } from 'src/entities/idea.entity';
import { User } from 'src/entities/user.entity';
import request from 'supertest';
import { generateTestJwt } from 'test/jwt-helper';
import { createTestIdea, createTestUser } from 'test/test-helpers';
import { DeepPartial } from 'typeorm';

interface ErrorResponse {
  message: string;
}

interface TestSetup {
  user: User;
  idea: Idea;
  token: string;
}

interface UserWithToken {
  user: User;
  token: string;
}

async function setupTestUserAndIdea(
  username = 'testuser',
  email = 'test@example.com',
  ideaTitle = 'title',
  ideaContent = 'test content',
): Promise<TestSetup> {
  const user = await createTestUser(username, email, 'password123');
  const idea = await createTestIdea(ideaTitle, ideaContent, user.profileId, []);
  const token = generateTestJwt({
    sub: user.id,
    userProfileId: user.profileId,
  });
  return { user, idea, token };
}

async function setupTestUserWithToken(
  username: string,
  email: string,
): Promise<UserWithToken> {
  const user = await createTestUser(username, email, 'password123');
  const token = generateTestJwt({
    sub: user.id,
    userProfileId: user.profileId,
  });
  return { user, token };
}

async function setupMultipleTestUsers(
  count: number,
  startIndex = 100,
): Promise<UserWithToken[]> {
  const users: UserWithToken[] = [];
  const timestamp = Date.now();
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    const userWithToken = await setupTestUserWithToken(
      `testuser${index}`,
      `test${index}-${timestamp}@example.com`,
    );
    users.push(userWithToken);
  }
  return users;
}

async function createTestComment(
  content: string,
  ideaId: string,
  token: string,
  parentCommentId?: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/v1/comment')
    .set('Authorization', `Bearer ${token}`)
    .send({
      content,
      ideaId,
      ...(parentCommentId && { parentCommentId }),
    });

  expect(response.status).toEqual(201);
  return response.body.id;
}

async function getCommentById(
  commentId: string,
  token?: string,
): Promise<request.Response> {
  const req = request(app.getHttpServer()).get(`/v1/comment/${commentId}`);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}

async function createLikesForComment(
  commentId: string,
  userIds: string[],
): Promise<void> {
  for (const userId of userIds) {
    await likeRepository.save({
      profileId: userId,
      commentId: commentId,
      ideaId: null,
    });
  }
}

async function createRepliesForComment(
  parentCommentId: string,
  ideaId: string,
  authorId: string,
  count: number,
): Promise<void> {
  for (let i = 1; i <= count; i++) {
    await commentRepository.save({
      content: `Reply ${i}`,
      authorId: authorId,
      ideaId: ideaId,
      parentCommentId: parentCommentId,
    } as DeepPartial<Comment>);
  }
}

function expectCommentStructure(body: CommentDto): void {
  expect(body.id).toBeDefined();
  expect(body.content).toBeDefined();
  expect(body.author).toBeDefined();
  expect(body.ideaId).toBeDefined();
  expect(body.parentCommentId).toBeDefined();
  expect(body.likes).toBeDefined();
  expect(body.replies).toBeDefined();
  expect(body.isLiked).toBeDefined();
  expect(body.createdAt).toBeDefined();
}

describe('/v1/comment/:id (GET)', () => {
  it('should return 200 and a comment given the id', async () => {
    const { user, idea, token } = await setupTestUserAndIdea();
    const commentId = await createTestComment('Test Comment', idea.id, token);

    const response = await getCommentById(commentId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expectCommentStructure(body);
    expect(body.content).toEqual('Test Comment');
    expect(body.author.id).toEqual(user.profileId);
    expect(body.author.displayName).toBeDefined();
    expect(body.ideaId).toEqual(idea.id);
    expect(body.parentCommentId).toBeNull();
  });

  it('should return comment without authentication (public route)', async () => {
    const { idea, token } = await setupTestUserAndIdea();
    const commentId = await createTestComment('Public Comment', idea.id, token);

    const response = await getCommentById(commentId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expect(body.content).toEqual('Public Comment');
    expect(body.isLiked).toBe(false);
  });

  it('should return comment and correct isLiked', async () => {
    const {
      idea,
      token,
    } = await setupTestUserAndIdea('testuser1', 'test1@example.com');
    const [user2, user3] = await setupMultipleTestUsers(2);
    const commentId = await createTestComment(
      'Comment with likes',
      idea.id,
      token,
    );

    await createLikesForComment(commentId, [user2.user.profileId]);

    const responseUser2 = await getCommentById(commentId, user2.token);
    expect(responseUser2.status).toEqual(200);
    expect(responseUser2.body.isLiked).toBe(true);

    const responseUser3 = await getCommentById(commentId, user3.token);
    expect(responseUser3.status).toEqual(200);
    expect(responseUser3.body.isLiked).toBe(false);
  });

  it('should return comment with replies', async () => {
    const { user, idea, token } = await setupTestUserAndIdea();
    const parentCommentId = await createTestComment(
      'Parent Comment',
      idea.id,
      token,
    );

    await createRepliesForComment(parentCommentId, idea.id, user.profileId, 3);

    const response = await getCommentById(parentCommentId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expect(body.replies).toEqual(3);
  });

  it('should return comment with likes', async () => {
    const { idea, token } = await setupTestUserAndIdea(
      'testuser1',
      'test1@example.com',
    );
    const [user2, user3, user4] = await setupMultipleTestUsers(3);
    const commentId = await createTestComment(
      'Comment with multiple likes',
      idea.id,
      token,
    );

    await createLikesForComment(commentId, [
      user2.user.profileId,
      user3.user.profileId,
      user4.user.profileId,
    ]);

    const response = await getCommentById(commentId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expect(body.likes).toEqual(3);
  });

  it('should return comment without replies and likes', async () => {
    const { idea, token } = await setupTestUserAndIdea();
    const commentId = await createTestComment(
      'Comment without replies and likes',
      idea.id,
      token,
    );

    const response = await getCommentById(commentId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expect(body.replies).toEqual(0);
    expect(body.likes).toEqual(0);
    expect(body.isLiked).toBe(false);
  });

  it('should return reply comment (with parentCommentId)', async () => {
    const { idea, token } = await setupTestUserAndIdea();
    const parentCommentId = await createTestComment(
      'Parent Comment',
      idea.id,
      token,
    );
    const replyId = await createTestComment(
      'Reply Comment',
      idea.id,
      token,
      parentCommentId,
    );

    const response = await getCommentById(replyId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expect(body.content).toEqual('Reply Comment');
    expect(body.parentCommentId).toEqual(parentCommentId);
  });

  it('should return 400 when ID is invalid (not UUID)', async () => {
    const response = await getCommentById('invalid-id');

    expect(response.status).toBe(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('INVALID_ID');
  });

  it('should return 404 when comment does not exist', async () => {
    const nonExistentId = '1e9c20a4-3f8d-4b71-8c0e-92a15f0b6d2c';
    const response = await getCommentById(nonExistentId);

    expect(response.status).toBe(404);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('COMMENT_NOT_FOUND');
  });

  it('should load author with user correctly', async () => {
    const { user, idea, token } = await setupTestUserAndIdea(
      'testuser',
      'test@example.com',
      'idea title',
      'content',
    );
    const commentId = await createTestComment(
      'Comment to test author',
      idea.id,
      token,
    );

    const response = await getCommentById(commentId);

    expect(response.status).toEqual(200);
    const body = response.body as CommentDto;
    expect(body.author).toBeDefined();
    expect(body.author.id).toEqual(user.profileId);
    expect(body.author.displayName).toEqual('testuser');
    expect(body.author.user).toBeDefined();
    expect(body.author.user.username).toEqual('testuser');
    expect(body.author.user.email).toEqual('test@example.com');
  });
});
