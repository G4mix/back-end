import { IsUUID } from 'class-validator';

export class DeleteProjectInput {
  @IsUUID(undefined, { message: 'INVALID_PROJECT_ID' })
  projectId: string;
}
