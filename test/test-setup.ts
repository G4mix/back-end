import { S3Client } from '@aws-sdk/client-s3';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { Comment } from 'src/entities/comment.entity';
import { Follow } from 'src/entities/follow.entity';
import { Idea } from 'src/entities/idea.entity';
import { Like } from 'src/entities/like.entity';
import { Profile } from 'src/entities/profile.entity';
import { Tag } from 'src/entities/tag.entity';
import { User } from 'src/entities/user.entity';
import { View } from 'src/entities/view.entity';
import { SES_CLIENT } from 'src/shared/gateways/ses.gateway';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { S3_CLIENT } from '../src/shared/gateways/s3.gateway';
import { clearDatabase, createTestModule, setupTestApp } from './module';

declare global {
  var app: INestApplication<App>;
  var dataSource: DataSource;
  var jwtService: JwtService;
  var userRepository: Repository<User>;
  var profileRepository: Repository<Profile>;
  var followRepository: Repository<Follow>;
  var s3Client: S3Client;
  var sesClient: SESv2Client;
  var commentRepository: Repository<Comment>;
  var ideaRepository: Repository<Idea>;
  var likeRepository: Repository<Like>;
  var tagRepository: Repository<Tag>;
  var viewRepository: Repository<View>;
}

export const mocksSetup = async (moduleFixture: TestingModule) => {
  const app = await setupTestApp(moduleFixture);
  global.app = app;
  global.dataSource = app.get(DataSource);
  global.jwtService = app.get(JwtService);
  global.userRepository = app.get('UserRepository');
  global.profileRepository = app.get('ProfileRepository');
  global.commentRepository = app.get('CommentRepository');
  global.ideaRepository = app.get('IdeaRepository');
  global.followRepository = app.get('FollowRepository');
  global.likeRepository = app.get('LikeRepository');
  global.tagRepository = app.get('TagRepository');
  global.viewRepository = app.get('ViewRepository');
  global.s3Client = app.get(S3_CLIENT);
  global.sesClient = app.get(SES_CLIENT);
};

beforeAll(async () => {
  const moduleFixture = await createTestModule();
  await mocksSetup(moduleFixture);
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
