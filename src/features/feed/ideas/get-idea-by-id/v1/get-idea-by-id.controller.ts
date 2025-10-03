import { type RequestWithUserData } from 'src/jwt/jwt.strategy';
import {
  Controller,
  Get,
  Logger,
  Request,
  Version,
  Param,
} from '@nestjs/common';
import { GetIdeaByIdInput } from './get-idea-by-id.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Idea, IdeaDto } from 'src/entities/idea.entity';
import { IdeaNotFound } from 'src/shared/errors';

@Controller('/idea')
export class GetIdeaByIdController {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
  ) {}
  readonly logger = new Logger(this.constructor.name);

  @Get('/:id')
  @Version('1')
  async getIdeaById(
    @Request() req: RequestWithUserData,
    @Param() { id }: GetIdeaByIdInput,
  ): Promise<IdeaDto> {
    const idea = await this.ideaRepository.findOne({
      where: { id },
      relations: [
        'author',
        'author.user',
        'images',
        'tags',
        'comments',
        'likes',
        'views',
        'links',
      ],
    });
    if (!idea) throw new IdeaNotFound();
    return idea.toDto(req.user?.userProfileId);
  }
}
