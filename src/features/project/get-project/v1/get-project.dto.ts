import { IsUUID } from 'class-validator';

export class GetProjectInput {
  @IsUUID(undefined, { message: 'INVALID_PROJECT_ID' })
  projectId: string;
}
