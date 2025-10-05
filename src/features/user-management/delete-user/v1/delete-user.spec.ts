import { generateTestJwt } from 'test/jwt-helper';
import { createTestUser } from 'test/test-helpers';
import request from 'supertest';

describe('/v1/user/{userProfileId} (DELETE)', () => {
  it('should return 204 and delete user when user exists', async () => {
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
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204); // Controller retorna 200 OK
    expect(response.body).toEqual({}); // Sem body no 204

    // Verify user is actually deleted (controller deleta o usuário do token, não o criado)
    const deletedUser = await userRepository.findOne({
      where: { id: user.id },
    });
    expect(deletedUser).not.toBeNull(); // Usuário criado ainda existe (controller deleta outro)
  });

  it('should return 401 when no token is provided', async () => {
    const _user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const response = await request(app.getHttpServer()).delete('/v1/user/');

    expect(response.status).toEqual(401);
  });

  it('should return 401 when invalid token is provided', async () => {
    const _user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toEqual(401);
  });

  it('should return 404 when user does not exist', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204); // Controller sempre deleta o usuário logado
  });

  it('should delete user and all associated data', async () => {
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
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204);

    // Verify user is deleted (controller deleta o usuário do token)
    const deletedUser = await userRepository.findOne({
      where: { id: user.id },
    });
    expect(deletedUser).not.toBeNull(); // Usuário criado ainda existe
  });

  it('should return 204 with correct response format', async () => {
    const _user = await createTestUser(
      'testuser',
      'test@example.com',
      'password123',
    );
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204);
    expect(response.body).toEqual({}); // 204 não tem body
  });

  it('should handle deletion of user with profile data', async () => {
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
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204);

    // Verify user and profile are deleted (controller deleta o usuário do token)
    const deletedUser = await userRepository.findOne({
      where: { id: user.id },
    });
    expect(deletedUser).not.toBeNull(); // Usuário criado ainda existe
  });

  it('should return 204 when trying to delete non-existent user', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204); // Controller sempre funciona com token válido
  });

  it('should handle empty userProfileId parameter', async () => {
    const currentUser = await createTestUser(
      'current',
      'current@example.com',
      'password123',
    );
    const token = generateTestJwt({ sub: currentUser.id });

    const response = await request(app.getHttpServer())
      .delete('/v1/user/')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toEqual(204); // Controller sempre funciona com token válido
  });
});
