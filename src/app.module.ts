import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { GetHealthStatusController } from './features/get-health-status/v1/get-health-status.controller';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from './entities/user.entity';
import { UserCode } from './entities/user-code.entity';
import { UserOAuth } from './entities/user-oauth.entity';
import { UserProfile } from './entities/user-profile.entity';
import { SignInController } from './features/auth/signin/v1/signin.controller';
import { SignupController } from './features/auth/signup/v1/signup.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt/auth.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { Follow } from './entities/follow.entity';
import { Link } from './entities/link.entity';
import { JwtModule } from '@nestjs/jwt';
import { SESGateway, SES_CLIENT } from './shared/gateways/ses.gateway';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { RefreshTokenController } from './features/auth/refresh-token/v1/refresh-token.controller';
import { GetAllUsersController } from './features/user-management/get-all-users/v1/get-all-users.controller';

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
      UserCode,
      UserOAuth,
      UserProfile,
      Follow,
      Link,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SIGNING_KEY_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    GetHealthStatusController,
    SignInController,
    SignupController,
    RefreshTokenController,
    GetAllUsersController,
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
          region: configService.get<string>('AWS_REGION'),
        }),
      inject: [ConfigService],
    },
    SESGateway,
  ],
})
export class AppModule {}
