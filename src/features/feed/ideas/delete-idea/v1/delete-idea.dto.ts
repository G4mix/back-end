import { IsUUID } from 'class-validator';

export class DeleteIdeaInput {
  @IsUUID(undefined, { message: 'INVALID_ID' })
  id: string;
}
