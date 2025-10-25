import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { GetHealthStatusController } from './features/get-health-status/v1/get-health-status.controller';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from './entities/user.entity';
import { OAuth } from './entities/oauth.entity';
import { Profile } from './entities/profile.entity';
import { SignInController } from './features/auth/signin/v1/signin.controller';
import { SignupController } from './features/auth/signup/v1/signup.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt/auth.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { Follow } from './entities/follow.entity';
import { JwtModule } from '@nestjs/jwt';
import { SESGateway, SES_CLIENT } from './shared/gateways/ses.gateway';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { RefreshTokenController } from './features/auth/refresh-token/v1/refresh-token.controller';
import { GetAllUsersController } from './features/user-management/get-all-users/v1/get-all-users.controller';
import { GetUserByIdController } from './features/user-management/get-user-by-id/v1/get-user-by-id.controller';
import { DeleteUserController } from './features/user-management/delete-user/v1/delete-user.controller';
import { ToggleFollowController } from './features/user-management/toggle-follow/v1/toggle-follow.controller';
import { S3Client } from '@aws-sdk/client-s3';
import { S3_CLIENT, S3Gateway } from './shared/gateways/s3.gateway';
import { UpdateUserController } from './features/user-management/update-user/v1/update-user.controller';
import { CreateIdeaController } from './features/feed/ideas/create-idea/v1/create-idea.controller';
import { Idea } from './entities/idea.entity';
import { Like } from './entities/like.entity';
import { View } from './entities/view.entity';
import { Tag } from './entities/tag.entity';
import { Comment } from './entities/comment.entity';
import { GetAllIdeasController } from './features/feed/ideas/get-all-ideas/v1/get-all-ideas.controller';
import { GetIdeaByIdController } from './features/feed/ideas/get-idea-by-id/v1/get-idea-by-id.controller';
import { UpdateIdeaController } from './features/feed/ideas/update-idea/v1/update-idea.controller';
import { DeleteIdeaController } from './features/feed/ideas/delete-idea/v1/delete-idea.controller';
import { ToggleLikeController } from './features/feed/toggle-like/v1/toggle-like.controller';
import { RecordViewController } from './features/feed/ideas/record-view/v1/record-view.controller';
import { CreateCommentController } from './features/feed/comments/create-comment/v1/create-comment.controller';
import { GetAllCommentsController } from './features/feed/comments/get-all-comments/v1/get-all-comments.controller';
import { GetCommentByIdController } from './features/feed/comments/get-comment-by-id/v1/get-comment-by-id.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('PG_DB_URL'),
        autoLoadEntities: true,
        entities: [join(__dirname, '/entities/*.entity.{ts,js}')],
        logging: false,
        synchronize: true,
        namingStrategy: new SnakeNamingStrategy(),
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      OAuth,
      Profile,
      Follow,
      Idea,
      Like,
      View,
      Tag,
      Comment,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SIGNING_KEY_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: SES_CLIENT,
      useFactory: (configService: ConfigService) =>
        new SESv2Client({
          region: configService.get<string>('AWS_REGION')!,
          credentials: {
            accessKeyId: configService.get<string>('AWS_SES_KEY')!,
            secretAccessKey: configService.get<string>('AWS_SES_SECRET')!,
          },
        }),
      inject: [ConfigService],
    },
    {
      provide: S3_CLIENT,
      useFactory: (configService: ConfigService) =>
        new S3Client({
          region: configService.get<string>('AWS_REGION')!,
          credentials: {
            accessKeyId: configService.get<string>('AWS_S3_KEY')!,
            secretAccessKey: configService.get<string>('AWS_S3_SECRET')!,
          },
        }),
      inject: [ConfigService],
    },
    SESGateway,
    S3Gateway,
  ],
  controllers: [
    GetHealthStatusController,
    SignInController,
    SignupController,
    RefreshTokenController,
    GetAllUsersController,
    GetUserByIdController,
    DeleteUserController,
    ToggleFollowController,
    UpdateUserController,
    CreateIdeaController,
    GetAllIdeasController,
    GetIdeaByIdController,
    UpdateIdeaController,
    DeleteIdeaController,
    ToggleLikeController,
    RecordViewController,
    CreateCommentController,
    GetAllCommentsController,
    GetCommentByIdController,
  ],
})
export class AppModule {}
