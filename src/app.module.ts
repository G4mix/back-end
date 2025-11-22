import { S3Client } from '@aws-sdk/client-s3';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Chat } from './entities/chat.entity';
import { CollaborationRequest } from './entities/collaboration-request.entity';
import { Comment } from './entities/comment.entity';
import { Follow } from './entities/follow.entity';
import { Idea } from './entities/idea.entity';
import { Like } from './entities/like.entity';
import { Notification } from './entities/notification.entity';
import { OAuth } from './entities/oauth.entity';
import { Profile } from './entities/profile.entity';
import { Project } from './entities/project.entity';
import { Tag } from './entities/tag.entity';
import { User } from './entities/user.entity';
import { View } from './entities/view.entity';
import { RefreshTokenController } from './features/auth/refresh-token/v1/refresh-token.controller';
import { SignInController } from './features/auth/signin/v1/signin.controller';
import { SignupController } from './features/auth/signup/v1/signup.controller';
import { GetAllChatsController } from './features/chat/get-all-chats/v1/get-all-chats.controller';
import { GetChatController } from './features/chat/get-chat/v1/get-chat.controller';
import { SendMessageController } from './features/chat/send-message/v1/send-message.controller';
import { StartChatController } from './features/chat/start-chat/v1/start-chat.controller';
import { CollaborationApprovalController } from './features/collaboration-requests/collaboration-approval/v1/collaboration-approval.controller';
import { CollaborationRequestController } from './features/collaboration-requests/collaboration-request/v1/collaboration-request.controller';
import { GetCollaborationRequestController } from './features/collaboration-requests/get-collaboration-request/v1/get-collaboration-request.controller';
import { CreateCommentController } from './features/feed/comments/create-comment/v1/create-comment.controller';
import { GetAllCommentsController } from './features/feed/comments/get-all-comments/v1/get-all-comments.controller';
import { GetCommentByIdController } from './features/feed/comments/get-comment-by-id/v1/get-comment-by-id.controller';
import { CreateIdeaController } from './features/feed/ideas/create-idea/v1/create-idea.controller';
import { DeleteIdeaController } from './features/feed/ideas/delete-idea/v1/delete-idea.controller';
import { GetAllIdeasController } from './features/feed/ideas/get-all-ideas/v1/get-all-ideas.controller';
import { GetIdeaByIdController } from './features/feed/ideas/get-idea-by-id/v1/get-idea-by-id.controller';
import { RecordViewController } from './features/feed/ideas/record-view/v1/record-view.controller';
import { UpdateIdeaController } from './features/feed/ideas/update-idea/v1/update-idea.controller';
import { ToggleLikeController } from './features/feed/toggle-like/v1/toggle-like.controller';
import { GetHealthStatusController } from './features/get-health-status/v1/get-health-status.controller';
import { GetAllNotificationsController } from './features/notifications/get-all-notifications/v1/get-all-notifications.controller';
import { ReadNotificationsController } from './features/notifications/read/v1/read.controller';
import { DeleteProjectController } from './features/project/delete-project/v1/delete-project.controller';
import { GetAllProjectsController } from './features/project/get-all-projects/v1/get-all-projects.controller';
import { GetProjectController } from './features/project/get-project/v1/get-project.controller';
import { RemoveMemberController } from './features/project/remove-member/v1/remove-member.controller';
import { UpdateProjectController } from './features/project/update-project/v1/update-project.controller';
import { DeleteUserController } from './features/user-management/delete-user/v1/delete-user.controller';
import { GetAllUsersController } from './features/user-management/get-all-users/v1/get-all-users.controller';
import { GetUserByIdController } from './features/user-management/get-user-by-id/v1/get-user-by-id.controller';
import { ToggleFollowController } from './features/user-management/toggle-follow/v1/toggle-follow.controller';
import { UpdateUserController } from './features/user-management/update-user/v1/update-user.controller';
import { JwtAuthGuard } from './jwt/auth.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { ChatGateway } from './shared/gateways/chat.gateway';
import { NotificationGateway } from './shared/gateways/notification.gateway';
import { S3Gateway, S3_CLIENT } from './shared/gateways/s3.gateway';
import { SESGateway, SES_CLIENT } from './shared/gateways/ses.gateway';

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
      CollaborationRequest,
      Chat,
      Project,
      Notification,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SIGNING_KEY_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get('RATE_LIMIT_TTL') ?? 60000,
          limit: config.get('RATE_LIMIT') ?? 500,
        },
      ],
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
    ChatGateway,
    NotificationGateway,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
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
    CollaborationRequestController,
    GetCollaborationRequestController,
    CollaborationApprovalController,
    GetAllChatsController,
    GetChatController,
    StartChatController,
    SendMessageController,
    UpdateProjectController,
    GetAllProjectsController,
    GetProjectController,
    DeleteProjectController,
    RemoveMemberController,
    GetAllNotificationsController,
    ReadNotificationsController,
  ],
})
export class AppModule {}
