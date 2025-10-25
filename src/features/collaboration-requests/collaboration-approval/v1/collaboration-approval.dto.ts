import { IsIn, IsUUID } from 'class-validator';
import { CollaborationRequestStatus } from 'src/entities/collaboration-request.entity';

export class CollaborationApprovalInput {
  @IsUUID(undefined, { message: 'INVALID_COLLABORATION_REQUEST_ID' })
  collaborationRequestId: string;

  @IsIn([
    CollaborationRequestStatus.APPROVED,
    CollaborationRequestStatus.REJECTED,
  ])
  readonly status: CollaborationRequestStatus;
}
