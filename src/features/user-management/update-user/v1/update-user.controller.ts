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
import { UpdateUserProfileInput } from './update-user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { hashSync } from 'bcrypt';
import { UserProfileDto } from 'src/entities/user-profile.entity';
import { Link } from 'src/entities/link.entity';
import { SESGateway } from 'src/shared/gateways/ses.gateway';
import {
  S3Gateway,
  SUPPORTED_IMAGES,
  fileInterceptorOptions,
} from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { PictureUpdateFail, UserNotFound } from 'src/shared/errors';
import { safeSave } from 'src/shared/utils/safeSave';
import { UserProfile } from '../../../../entities/user-profile.entity';

@Controller('/user')
export class UpdateUserController {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly configService: ConfigService,
    private readonly sesGateway: SESGateway,
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
    @Body() { autobiography, displayName, links, user }: UpdateUserProfileInput,
    @UploadedFiles()
    files: {
      icon?: Express.Multer.File[];
      backgroundImage?: Express.Multer.File[];
    },
  ): Promise<UserProfileDto> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id: userProfileId },
      relations: ['links', 'user'],
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
      await this.userProfileRepository.manager.delete(Link, {
        userProfileId,
      });
      const updatedLinks = links?.map((link) => {
        const updatedLink = new Link();
        updatedLink.url = link;
        updatedLink.userProfileId = userProfileId;
        return updatedLink;
      });
      userProfile.links = updatedLinks;
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
      await this.sesGateway.verifyIdentity(email);
    }
    Object.assign(
      userProfile.user,
      username && { username },
      password && { password: hashSync(password, 10) },
    );
    await safeSave(this.userProfileRepository, userProfile);

    return userProfile.toDto();
  }
}
