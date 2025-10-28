import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Request,
  UploadedFiles,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { UpdateProfileInput } from './update-user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { hashSync } from 'bcrypt';
import { ProfileDto } from 'src/entities/profile.entity';
import {
  S3Gateway,
  SUPPORTED_IMAGES,
  fileInterceptorOptions,
} from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { PictureUpdateFail, UserNotFound } from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safe-save.util';
import { Profile } from '../../../../entities/profile.entity';

@Controller('/user')
export class UpdateUserController {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly configService: ConfigService,
    private readonly s3Gateway: S3Gateway,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Patch()
  @Version('1')
  @Protected()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'icon', maxCount: 1 },
        { name: 'backgroundImage', maxCount: 1 },
      ],
      fileInterceptorOptions,
    ),
  )
  async updateUser(
    @Request() { user: { sub: id, userProfileId } }: RequestWithUserData,
    @Body() { autobiography, displayName, links, user }: UpdateProfileInput,
    @UploadedFiles()
    files: {
      icon?: Express.Multer.File[];
      backgroundImage?: Express.Multer.File[];
    },
  ): Promise<ProfileDto> {
    const userProfile = await this.profileRepository.findOne({
      where: { id: userProfileId },
      relations: ['user'],
    });
    if (!userProfile) throw new UserNotFound();
    const icon = files.icon?.[0];
    const backgroundImage = files.backgroundImage?.[0];

    if (icon) {
      const userIconRes = await this.s3Gateway.uploadFile({
        bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
        key: `user-${id}/icon${SUPPORTED_IMAGES[icon.mimetype as keyof typeof SUPPORTED_IMAGES]}`,
        file: icon.buffer,
      });
      if (typeof userIconRes !== 'object') throw new PictureUpdateFail();
      if (userIconRes.fileUrl) userProfile.icon = userIconRes.fileUrl;
    }

    if (backgroundImage) {
      const userbackgroundImageRes = await this.s3Gateway.uploadFile({
        bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
        key: `user-${id}/backgroundImage${SUPPORTED_IMAGES[backgroundImage.mimetype as keyof typeof SUPPORTED_IMAGES]}`,
        file: backgroundImage.buffer,
      });
      if (typeof userbackgroundImageRes !== 'object') {
        throw new PictureUpdateFail();
      }
      if (userbackgroundImageRes.fileUrl) {
        userProfile.backgroundImage = userbackgroundImageRes.fileUrl;
      }
    }

    if (links) {
      userProfile.links = links;
    }

    Object.assign(
      userProfile,
      displayName && { displayName },
      autobiography && { autobiography },
    );

    const { email, password, username } = user;
    if (email) {
      userProfile.user.email = email;
      userProfile.user.verified = false;
      // todo: send email verification
    }
    Object.assign(
      userProfile.user,
      username && { username },
      password && { password: hashSync(password, 10) },
    );
    await safeSave(this.profileRepository, userProfile);

    return userProfile.toDto();
  }
}
