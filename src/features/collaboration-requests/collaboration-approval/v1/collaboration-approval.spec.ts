import { Chat } from 'src/entities/chat.entity';
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from 'src/entities/collaboration-request.entity';
import { Idea } from 'src/entities/idea.entity';
import { Project } from 'src/entities/project.entity';
import request from 'supertest';
import { generateTestJwt } from 'test/jwt-helper';
import { createTestUser } from 'test/test-helpers';

const createIdea = async (authorId: string) => {
  return ideaRepository.save({
    authorId,
    title: 'Idea',
    content: 'Content',
    images: ['img'],
  });
};

const createCollaborationRequest = async (idea: Idea, requesterId: string) => {
  const repo = dataSource.getRepository(CollaborationRequest);
  return repo.save({
    ideaId: idea.id,
    requesterId,
    message: 'message',
  });
};

const startPendingChat = async (
  ideaId: string,
  requesterId: string,
  token: string,
) => {
  const response = await request(app.getHttpServer())
    .post('/v1/chat/start')
    .set('Authorization', `Bearer ${token}`)
    .send({ ideaId, requesterId });
  return response.body as { id: string };
};

describe('/v1/collaboration-approval (PATCH)', () => {
  it('approves without pending chat and creates project and chat', async () => {
    const author = await createTestUser(
      'author',
      'author@example.com',
      'password',
    );
    const requester = await createTestUser(
      'requester',
      'requester@example.com',
      'password',
    );
    const idea = await createIdea(author.profileId);
    const collaborationRequest = await createCollaborationRequest(
      idea,
      requester.profileId,
    );
    const token = generateTestJwt({
      sub: author.id,
      userProfileId: author.profileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/collaboration-approval')
      .set('Authorization', `Bearer ${token}`)
      .query({
        collaborationRequestId: collaborationRequest.id,
        status: CollaborationRequestStatus.APPROVED,
      })
      .send({ feedback: 'okay' });

    expect(response.status).toEqual(202);

    const collabRepo = dataSource.getRepository(CollaborationRequest);
    const updated = await collabRepo.findOne({
      where: { id: collaborationRequest.id },
    });
    expect(updated?.status).toEqual(CollaborationRequestStatus.APPROVED);
    expect(updated?.feedback).toEqual('okay');
    expect(updated?.chatId).toBeNull();

    const reloadedIdea = await ideaRepository.findOne({
      where: { id: idea.id },
    });
    expect(reloadedIdea?.projectId).toBeDefined();
    const projectRepo = dataSource.getRepository(Project);
    const project = await projectRepo.findOne({
      where: { id: reloadedIdea!.projectId! },
      relations: ['members', 'chat'],
    });
    expect(project?.members.map((m) => m.id)).toEqual(
      expect.arrayContaining([author.profileId, requester.profileId]),
    );
    expect(project?.chatId).toBeDefined();
    const chatRepo = dataSource.getRepository(Chat);
    const chat = await chatRepo.findOne({
      where: { id: project!.chatId! },
      relations: ['members'],
    });
    expect(chat?.members.map((m) => m.id)).toEqual(
      expect.arrayContaining([author.profileId, requester.profileId]),
    );
  });

  it('approves with pending chat, deletes it, and creates project chat', async () => {
    const author = await createTestUser(
      'author2',
      'author2@example.com',
      'password',
    );
    const requester = await createTestUser(
      'requester2',
      'requester2@example.com',
      'password',
    );
    const idea = await createIdea(author.profileId);
    const collaborationRequest = await createCollaborationRequest(
      idea,
      requester.profileId,
    );
    const token = generateTestJwt({
      sub: author.id,
      userProfileId: author.profileId,
    });
    const pendingChat = await startPendingChat(
      idea.id,
      requester.profileId,
      token,
    );

    const response = await request(app.getHttpServer())
      .patch('/v1/collaboration-approval')
      .set('Authorization', `Bearer ${token}`)
      .query({
        collaborationRequestId: collaborationRequest.id,
        status: CollaborationRequestStatus.APPROVED,
      })
      .send({ feedback: 'done!' });

    expect(response.status).toEqual(202);

    const collabRepo = dataSource.getRepository(CollaborationRequest);
    const updated = await collabRepo.findOne({
      where: { id: collaborationRequest.id },
    });
    expect(updated?.status).toEqual(CollaborationRequestStatus.APPROVED);
    expect(updated?.chatId).toBeNull();

    const chatRepo = dataSource.getRepository(Chat);
    const deletedChat = await chatRepo.findOne({
      where: { id: pendingChat.id },
    });
    expect(deletedChat).toBeNull();

    const ideaReloaded = await ideaRepository.findOne({
      where: { id: idea.id },
    });
    const projectRepo = dataSource.getRepository(Project);
    const project = await projectRepo.findOne({
      where: { id: ideaReloaded!.projectId! },
      relations: ['members', 'chat'],
    });
    expect(project?.chatId).toBeDefined();
  });

  it('rejects and removes pending chat without creating project', async () => {
    const author = await createTestUser(
      'author3',
      'author3@example.com',
      'password',
    );
    const requester = await createTestUser(
      'requester3',
      'requester3@example.com',
      'password',
    );
    const idea = await createIdea(author.profileId);
    const collaborationRequest = await createCollaborationRequest(
      idea,
      requester.profileId,
    );
    const token = generateTestJwt({
      sub: author.id,
      userProfileId: author.profileId,
    });
    const pendingChat = await startPendingChat(
      idea.id,
      requester.profileId,
      token,
    );

    const response = await request(app.getHttpServer())
      .patch('/v1/collaboration-approval')
      .set('Authorization', `Bearer ${token}`)
      .query({
        collaborationRequestId: collaborationRequest.id,
        status: CollaborationRequestStatus.REJECTED,
      })
      .send({ feedback: 'nope' });

    expect(response.status).toEqual(202);

    const collabRepo = dataSource.getRepository(CollaborationRequest);
    const updated = await collabRepo.findOne({
      where: { id: collaborationRequest.id },
    });
    expect(updated?.status).toEqual(CollaborationRequestStatus.REJECTED);
    expect(updated?.chatId).toBeNull();

    const chatRepo = dataSource.getRepository(Chat);
    const deletedChat = await chatRepo.findOne({
      where: { id: pendingChat.id },
    });
    expect(deletedChat).toBeNull();

    const ideaReloaded = await ideaRepository.findOne({
      where: { id: idea.id },
    });
    expect(ideaReloaded?.projectId).toBeNull();
    const projectRepo = dataSource.getRepository(Project);
    const projects = await projectRepo.find();
    expect(projects.length).toEqual(0);
  });

  it('returns 403 when requester is not the idea author', async () => {
    const author = await createTestUser(
      'author4',
      'author4@example.com',
      'password',
    );
    const requester = await createTestUser(
      'requester4',
      'requester4@example.com',
      'password',
    );
    const other = await createTestUser(
      'other4',
      'other4@example.com',
      'password',
    );
    const idea = await createIdea(author.profileId);
    const collaborationRequest = await createCollaborationRequest(
      idea,
      requester.profileId,
    );
    const token = generateTestJwt({
      sub: other.id,
      userProfileId: other.profileId,
    });

    const response = await request(app.getHttpServer())
      .patch('/v1/collaboration-approval')
      .set('Authorization', `Bearer ${token}`)
      .query({
        collaborationRequestId: collaborationRequest.id,
        status: CollaborationRequestStatus.APPROVED,
      })
      .send({ feedback: 'valid feedback' });

    expect(response.status).toEqual(403);
  });
});
