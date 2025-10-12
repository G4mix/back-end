import { IsUUID } from 'class-validator';

export class GetCommentByIdInput {
  @IsUUID(undefined, { message: 'INVALID_ID' })
  id: string;
}
