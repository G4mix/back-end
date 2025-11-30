import { Comment, CommentDto } from 'src/entities/comment.entity';
import request from 'supertest';
import { generateTestJwt } from 'test/jwt-helper';
import { createTestIdea, createTestUser } from 'test/test-helpers';
import { DeepPartial } from 'typeorm';

interface ErrorResponse {
    message: string;
}

describe('/v1/comment/:id (GET)', () => {
    it('sshould return 200 and a comment given the id', async () => {
        const user = await createTestUser(
            'testuser',
            'test@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user.profileId,
            [],
        );

        const tokenUser = generateTestJwt({
            sub: user.id,
            userProfileId: user.profileId,
        });

        const createResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Test Comment',
                ideaId: idea.id,
            });

        expect(createResponse.status).toEqual(201);
        const commentId = createResponse.body.id;

        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${commentId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.id).toBeDefined();
        expect(body.content).toEqual('Test Comment');
        expect(body.author).toBeDefined();
        expect(body.author.id).toEqual(user.profileId);
        expect(body.author.displayName).toBeDefined();
        expect(body.ideaId).toEqual(idea.id);
        expect(body.parentCommentId).toBeNull();
        expect(body.likes).toBeDefined();
        expect(body.replies).toBeDefined();
        expect(body.isLiked).toBeDefined();
        expect(body.createdAt).toBeDefined();
    });

    it('should return comment without authentication (public route)', async () => {
        const user = await createTestUser(
            'testuser',
            'test@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user.profileId,
            [],
        );

        const tokenUser = generateTestJwt({
            sub: user.id,
            userProfileId: user.profileId,
        });

        const createResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Public Comment',
                ideaId: idea.id,
            });

        const commentId = createResponse.body.id;
        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${commentId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.content).toEqual('Public Comment');
    });

    it('should return comment and correct isLiked', async () => {
        const user1 = await createTestUser(
            'testuser1',
            'test1@example.com',
            'password123',
        );

        const user2 = await createTestUser(
            'testuser2',
            'test2@example.com',
            'password123',
        );

        const user3 = await createTestUser(
            'testuser3',
            'test3@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user1.profileId,
            [],
        );

        const tokenUser1 = generateTestJwt({
            sub: user1.id,
            userProfileId: user1.profileId,
        });

        const createResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser1}`)
            .send({
                content: 'Comment with likes',
                ideaId: idea.id,
            });

        const commentId = createResponse.body.id;
        await likeRepository.save({
            profileId: user2.profileId,
            commentId: commentId,
            ideaId: null,
        });

        const tokenUser2 = generateTestJwt({
            sub: user2.id,
            userProfileId: user2.profileId,
        });

        // GET with user 2 
        const responseUser2 = await request(app.getHttpServer())
            .get(`/v1/comment/${commentId}`)
            .set('Authorization', `Bearer ${tokenUser2}`);

        expect(responseUser2.status).toEqual(200);
        const bodyUser2 = responseUser2.body as CommentDto;
        expect(bodyUser2.isLiked).toBe(true); // user2 liked

        const tokenUser3 = generateTestJwt({
            sub: user3.id,
            userProfileId: user3.profileId,
        });

        // GET user 3
        const responseUser3 = await request(app.getHttpServer())
            .get(`/v1/comment/${commentId}`)
            .set('Authorization', `Bearer ${tokenUser3}`);

        expect(responseUser3.status).toEqual(200);
        const bodyUser3 = responseUser3.body as CommentDto;
        expect(bodyUser3.isLiked).toBe(false); // user3 did not liked
    });

    it('should return comment with replies', async () => {
        const user = await createTestUser(
            'testuser',
            'test@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user.profileId,
            [],
        );

        const tokenUser = generateTestJwt({
            sub: user.id,
            userProfileId: user.profileId,
        });

        const parentCommentResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Parent Comment',
                ideaId: idea.id,
            });

        const parentCommentId = parentCommentResponse.body.id;

        await commentRepository.save({
            content: 'Reply 1',
            authorId: user.profileId,
            ideaId: idea.id,
            parentCommentId: parentCommentId,
        } as DeepPartial<Comment>);

        await commentRepository.save({
            content: 'Reply 2',
            authorId: user.profileId,
            ideaId: idea.id,
            parentCommentId: parentCommentId,
        } as DeepPartial<Comment>);

        await commentRepository.save({
            content: 'Reply 3',
            authorId: user.profileId,
            ideaId: idea.id,
            parentCommentId: parentCommentId,
        } as DeepPartial<Comment>);

        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${parentCommentId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.replies).toEqual(3); // 3 replies
    });

    it('should return comment with likes', async () => {
        const user1 = await createTestUser(
            'testuser1',
            'test1@example.com',
            'password123',
        );

        const user2 = await createTestUser(
            'testuser2',
            'test2@example.com',
            'password123',
        );

        const user3 = await createTestUser(
            'testuser3',
            'test3@example.com',
            'password123',
        );

        const user4 = await createTestUser(
            'testuser4',
            'test4@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user1.profileId,
            [],
        );

        const tokenUser1 = generateTestJwt({
            sub: user1.id,
            userProfileId: user1.profileId,
        });

        const createResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser1}`)
            .send({
                content: 'Comment with multiple likes',
                ideaId: idea.id,
            });

        const commentId = createResponse.body.id;


        await likeRepository.save({
            profileId: user2.profileId,
            commentId: commentId,
            ideaId: null,
        });

        await likeRepository.save({
            profileId: user3.profileId,
            commentId: commentId,
            ideaId: null,
        });

        await likeRepository.save({
            profileId: user4.profileId,
            commentId: commentId,
            ideaId: null,
        });

        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${commentId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.likes).toEqual(3); // 3 likes
    });

    it('should return comment without replies and likes', async () => {
        const user = await createTestUser(
            'testuser',
            'test@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user.profileId,
            [],
        );

        const tokenUser = generateTestJwt({
            sub: user.id,
            userProfileId: user.profileId,
        });

        const createResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Comment without replies and likes',
                ideaId: idea.id,
            });

        const commentId = createResponse.body.id;

        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${commentId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.replies).toEqual(0);
        expect(body.likes).toEqual(0);
        expect(body.isLiked).toBe(false);
    });

    it('should return reply comment (with parentCommentId)', async () => {
        const user = await createTestUser(
            'testuser',
            'test@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'title',
            'test content',
            user.profileId,
            [],
        );

        const tokenUser = generateTestJwt({
            sub: user.id,
            userProfileId: user.profileId,
        });

        const parentCommentResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Parent Comment',
                ideaId: idea.id,
            });

        const parentCommentId = parentCommentResponse.body.id;

        const replyResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Reply Comment',
                ideaId: idea.id,
                parentCommentId: parentCommentId,
            });

        const replyId = replyResponse.body.id;

        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${replyId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.content).toEqual('Reply Comment');
        expect(body.parentCommentId).toEqual(parentCommentId);
    });

    it('should return 400 when ID is invalid (not UUID)', async () => {
        const response = await request(app.getHttpServer()).get(
            '/v1/comment/invalid-id',
        );

        expect(response.status).toBe(400);
        const body = response.body as ErrorResponse;
        expect(body.message).toContain('INVALID_ID');
    });

    it('should return 404 when comment does not exist', async () => {
        const nonExistentId = '1e9c20a4-3f8d-4b71-8c0e-92a15f0b6d2c';
        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${nonExistentId}`,
        );

        expect(response.status).toBe(404);
        const body = response.body as ErrorResponse;
        expect(body.message).toContain('COMMENT_NOT_FOUND');
    });

    it('should load author with user correctly', async () => {
        const user = await createTestUser(
            'testuser',
            'test@example.com',
            'password123',
        );

        const idea = await createTestIdea(
            'Test Idea Title',
            'This is the content of the test idea',
            user.profileId,
            [],
        );

        const tokenUser = generateTestJwt({
            sub: user.id,
            userProfileId: user.profileId,
        });

        const createResponse = await request(app.getHttpServer())
            .post('/v1/comment')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                content: 'Comment to test author',
                ideaId: idea.id,
            });

        const commentId = createResponse.body.id;

        const response = await request(app.getHttpServer()).get(
            `/v1/comment/${commentId}`,
        );

        expect(response.status).toEqual(200);
        const body = response.body as CommentDto;
        expect(body.author).toBeDefined();
        expect(body.author.id).toBeDefined();
        expect(body.author.id).toEqual(user.profileId);
        expect(body.author.displayName).toBeDefined();
        expect(body.author.displayName).toEqual('testuser');
        expect(body.author.user).toBeDefined();
        expect(body.author.user.username).toEqual('testuser');
        expect(body.author.user.email).toEqual('test@example.com');
    });
});
