import request from 'supertest';
import { SigninOutput } from './signin.dto';
import { createTestUser } from 'test/test-helpers';
import { createTestModule } from 'test/module';
import { SESGateway } from 'src/shared/gateways/ses.gateway';
import { AppModule } from 'src/app.module';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { mocksSetup } from 'test/test-setup';

interface ErrorResponse {
  message: string;
}

describe('/v1/auth/signin (POST)', () => {
  it('should return 200 and tokens when credentials are valid', async () => {
    await createTestUser('testuser', 'test@example.com', 'password123');

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toEqual(200);
    const body = response.body as SigninOutput;
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.userProfile).toBeDefined();
    expect(body.userProfile.user.email).toEqual('test@example.com');
  });

  it('should return 401 when user is not found', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('INVALID_EMAIL_OR_PASSWORD');
  });

  it('should return 400 when password is incorrect', async () => {
    await createTestUser('testuser', 'test@example.com', 'correctpassword');

    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toEqual('INVALID_EMAIL_OR_PASSWORD');
  });

  it('should validate required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({});

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('EMAIL_REQUIRED');
  });

  it('should validate email format', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/signin')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
      });

    expect(response.status).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('INVALID_EMAIL');
  });

  describe('Throttling Tests', () => {
    beforeEach(async () => {
      await app.close();
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(SESGateway)
        .useValue({
          sendEmail: jest.fn().mockResolvedValue({
            $metadata: { httpStatusCode: 200 },
            MessageId: 'aaaaaaaa',
          }),
        })
        .overrideProvider(ConfigService)
        .useValue({
          get: (key: string) => {
            if (key === 'RATE_LIMIT') return 5;
            if (key === 'RATE_LIMIT_TTL') return 950;
            return process.env[key];
          },
        })
        .compile();

      await mocksSetup(moduleFixture);
    });

    afterAll(async () => {
      await app.close();
      const moduleFixture = await createTestModule();
      await mocksSetup(moduleFixture);
    });

    it('should return 429 when account is blocked due to too many attempts', async () => {
      let response: request.Response | undefined;
      for (let i = 0; i < 6; i++) {
        response = await request(app.getHttpServer())
          .post('/v1/auth/signin')
          .send({
            email: 'test@example.com',
            password: 'correctpassword',
          });
      }
      expect(response!.status).toEqual(429);
      const body = response!.body as ErrorResponse;
      expect(body.message).toContain('TOO_MANY_REQUESTS');
    });
  });
});
