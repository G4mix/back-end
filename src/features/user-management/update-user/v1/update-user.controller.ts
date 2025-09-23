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
import { User, UserDto } from 'src/entities/user.entity';
import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import { UpdateUserInput } from './update-user.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { hashSync } from 'bcrypt';
import { UserProfile } from 'src/entities/user-profile.entity';
import { Link } from 'src/entities/link.entity';
import { SESGateway } from 'src/shared/gateways/ses.gateway';
import {
  S3Gateway,
  SUPPORTED_IMAGES,
  fileInterceptorOptions,
} from 'src/shared/gateways/s3.gateway';
import { ConfigService } from '@nestjs/config';
import { PictureUpdateFail } from 'src/shared/errors';

@Controller('/user')
export class UpdateUserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    @Request() { user: { sub: id } }: RequestWithUserData,
    @Body()
    { email, password, username, userProfile = {} }: UpdateUserInput,
    @UploadedFiles()
    files: {
      icon?: Express.Multer.File[];
      backgroundImage?: Express.Multer.File[];
    },
  ): Promise<UserDto> {
    const icon = files.icon?.[0];
    const backgroundImage = files.backgroundImage?.[0];

    const updatedUser: Partial<User> = Object.assign(
      {},
      email ? { verified: false, email } : undefined,
      password && { password: hashSync(password, 10) },
      username && { username },
    );

    if (email) await this.sesGateway.verifyIdentity(email);
    await this.userRepository.update(id, updatedUser);

    if (Object.keys(userProfile).length > 0 || icon || backgroundImage) {
      const { autobiography, displayName, links } = userProfile;
      const updatedLinks = links?.map((link) => {
        const updatedLink = new Link();
        updatedLink.url = link;
        return updatedLink;
      });

      const updatedUserProfile: Partial<UserProfile> = {
        autobiography,
        displayName,
        links: updatedLinks,
      };

      if (icon) {
        const userIconRes = await this.s3Gateway.uploadFile({
          bucketName: this.configService.get<string>('PUBLIC_BUCKET_NAME')!,
          key: `user-${id}/icon${SUPPORTED_IMAGES[icon.mimetype as keyof typeof SUPPORTED_IMAGES]}`,
          file: icon.buffer,
        });
        if (typeof userIconRes !== 'object') throw new PictureUpdateFail();
        if (userIconRes.fileUrl) updatedUserProfile.icon = userIconRes.fileUrl;
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
          updatedUserProfile.backgroundImage = userbackgroundImageRes.fileUrl;
        }
      }

      const userProfileRepo =
        this.userRepository.manager.getRepository(UserProfile);

      const profile = await userProfileRepo.findOne({
        where: { user: { id } },
        relations: ['links'],
      });

      if (profile) {
        userProfileRepo.merge(profile, updatedUserProfile);
        await userProfileRepo.save(profile);
      } else {
        const newProfile = userProfileRepo.create({
          ...updatedUserProfile,
          user: { id } as any,
        });
        await userProfileRepo.save(newProfile);

        await this.userRepository.update(id, { userProfileId: newProfile.id });
      }
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'userProfile',
        'userProfile.links',
        'userProfile.followers',
        'userProfile.following',
        'userCode',
      ],
    });
    return user!.toDto();
  }
}
