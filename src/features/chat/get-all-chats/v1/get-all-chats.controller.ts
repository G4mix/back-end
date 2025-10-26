import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  Request,
  Version,
} from '@nestjs/common';
import { GetAllChatsOutput, GetAllChatsInput } from './get-all-chats.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/entities/chat.entity';
import { Protected } from 'src/shared/decorators/protected.decorator';

@Controller('/chat')
export class GetAllChatsController {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Protected()
  async getAllChats(
    @Request() req: RequestWithUserData,
    @Query() { quantity, page }: GetAllChatsInput,
  ): Promise<GetAllChatsOutput> {
    const qb = this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.owner', 'owner')
      .leftJoinAndSelect('owner.user', 'ownerUser')
      .leftJoinAndSelect('chat.idea', 'idea')
      .leftJoinAndSelect('idea.author', 'ideaAuthor')
      .leftJoinAndSelect('ideaAuthor.user', 'ideaAuthorUser')
      .leftJoinAndSelect('chat.collaborationRequest', 'collaborationRequest')
      .leftJoinAndSelect('collaborationRequest.requester', 'requester')
      .leftJoinAndSelect('requester.user', 'requesterUser')
      .leftJoinAndSelect('chat.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .where('chat.ownerId = :currentUserId', {
        currentUserId: req.user.userProfileId,
      })
      .orWhere('members.id = :currentUserId', {
        currentUserId: req.user.userProfileId,
      });

    qb.skip(page * quantity).take(quantity);

    const [chats, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / quantity);
    const nextPage = page + 1;

    return {
      total,
      pages,
      page,
      nextPage: nextPage >= pages ? null : nextPage,
      data: chats.map((chat) => chat.toDto(req.user?.userProfileId)),
    };
  }
}
