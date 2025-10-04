import { IsUUID } from 'class-validator';

export class RecordViewInput {
  @IsUUID()
  targetIdeaId: string;
}
