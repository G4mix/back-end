import { IsUUID } from 'class-validator';

export class RecordViewInput {
  @IsUUID(undefined, { message: 'INVALID_TARGET_IDEA_ID' })
  targetIdeaId: string;
}
