import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createTestModule, setupTestApp } from './module';
import { User } from 'src/users/entities/user.entity';
import { UserCode } from 'src/users/entities/user-code.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';
import { App } from 'supertest/types';

declare global {
  var app: INestApplication<App>;
  var dataSource: DataSource;
  var jwtService: JwtService;
  var userRepository: Repository<User>;
  var userCodeRepository: Repository<UserCode>;
  var userProfileRepository: Repository<UserProfile>;
}

beforeEach(async () => {
  const module = await createTestModule();
  const app = await setupTestApp(module);
  global.app = app;
  global.dataSource = app.get(DataSource);
  global.jwtService = app.get(JwtService);
  global.userRepository = app.get('UserRepository');
  global.userCodeRepository = app.get('UserCodeRepository');
  global.userProfileRepository = app.get('UserProfileRepository');
});

afterEach(async () => {
  if (global.dataSource?.isInitialized) await global.dataSource.destroy();
  if (global.app) await global.app.close();
});
