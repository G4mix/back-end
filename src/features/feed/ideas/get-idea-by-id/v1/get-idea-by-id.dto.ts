import { IsUUID } from 'class-validator';

export class GetIdeaByIdInput {
  @IsUUID()
  id: string;
}
