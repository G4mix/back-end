import { IsUUID } from 'class-validator';

export class GetIdeaByIdInput {
  @IsUUID(undefined, { message: 'INVALID_ID' })
  id: string;
}
