import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class UpdateProjectParamsInput {
  @IsUUID(undefined, { message: 'INVALID_PROJECT_ID' })
  projectId: string;
}

export class UpdateProjectInput {
  @IsString({ message: 'INVALID_TITLE' })
  @Matches(/^[^{}]{3,100}$/, { message: 'INVALID_TITLE' })
  @IsOptional()
  title: string;

  @IsString({ message: 'INVALID_DESCRIPTION' })
  @Matches(/^[^{}]{3,300}$/, { message: 'INVALID_DESCRIPTION' })
  @IsOptional()
  description: string;
}
