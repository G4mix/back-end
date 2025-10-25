import { IsUUID } from 'class-validator';
import { CollaborationRequest } from 'src/entities/collaboration-request.entity';

export class GetCollaborationRequestInput {
  @IsUUID(undefined, { message: 'INVALID_COLLABORATION_REQUEST_ID' })
  collaborationRequestId: string;
}
export class GetCollaborationRequestOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: CollaborationRequest[];
}
