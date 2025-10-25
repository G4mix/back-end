import { IsUUID } from 'class-validator';
import { CollaborationRequest } from 'src/entities/collaboration-request.entity';

export class GetCollaborationRequestInput {
  @IsUUID()
  collaborationRequestId: string;
}
export class GetCollaborationRequestOutput {
  page: number;
  nextPage: number | null;
  pages: number;
  total: number;
  data: CollaborationRequest[];
}
