import { IsUUID } from 'class-validator';

export class DeleteIdeaInput {
  @IsUUID()
  id: string;
}
