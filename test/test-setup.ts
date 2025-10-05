import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { clearDatabase, createTestModule, setupTestApp } from './module';
import { User } from 'src/users/entities/user.entity';
import { UserCode } from 'src/users/entities/user-code.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';
import { App } from 'supertest/types';
import { S3Client } from '@aws-sdk/client-s3';
import { S3_CLIENT } from '../src/shared/gateways/s3.gateway';
import { SES_CLIENT } from 'src/shared/gateways/ses.gateway';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { Follow } from 'src/entities/follow.entity';

declare global {
  var app: INestApplication<App>;
  var dataSource: DataSource;
  var jwtService: JwtService;
  var userRepository: Repository<User>;
  var userCodeRepository: Repository<UserCode>;
  var userProfileRepository: Repository<UserProfile>;
  var followRepository: Repository<Follow>;
  var s3Client: S3Client;
  var sesClient: SESv2Client;
}

beforeAll(async () => {
  const module = await createTestModule();
  const app = await setupTestApp(module);
  global.app = app;
  global.dataSource = app.get(DataSource);
  global.jwtService = app.get(JwtService);
  global.userRepository = app.get('UserRepository');
  global.userCodeRepository = app.get('UserCodeRepository');
  global.userProfileRepository = app.get('UserProfileRepository');
  global.followRepository = app.get('FollowRepository');
  global.s3Client = app.get(S3_CLIENT);
  global.sesClient = app.get(SES_CLIENT);
});

beforeEach(async () => {
  await clearDatabase(app);
  (s3Client.send as jest.Mock).mockClear();
  (sesClient.send as jest.Mock).mockClear();
});

afterAll(async () => {
  if (global.dataSource?.isInitialized) await global.dataSource.destroy();
  if (global.app) await global.app.close();
});
