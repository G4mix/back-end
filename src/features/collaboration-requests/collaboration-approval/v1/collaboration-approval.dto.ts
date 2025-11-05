import { IsIn, IsString, IsUUID, Length } from 'class-validator';
import { CollaborationRequestStatus } from 'src/entities/collaboration-request.entity';

export class CollaborationApprovalQueryInput {
  @IsUUID(undefined, { message: 'INVALID_COLLABORATION_REQUEST_ID' })
  collaborationRequestId: string;

  @IsIn(
    [CollaborationRequestStatus.APPROVED, CollaborationRequestStatus.REJECTED],
    { message: 'INVALID_STATUS' },
  )
  readonly status: CollaborationRequestStatus;
}
export class CollaborationApprovalInput {
  @IsString({ message: 'INVALID_FEEDBACK' })
  @Length(3, 255, { message: 'INVALID_FEEDBACK' })
  readonly feedback: string;
}
