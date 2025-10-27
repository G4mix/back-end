import { IsIn, IsString, IsUUID, Length } from 'class-validator';
import { CollaborationRequestStatus } from 'src/entities/collaboration-request.entity';

export class CollaborationApprovalInput {
  @IsUUID(undefined, { message: 'INVALID_COLLABORATION_REQUEST_ID' })
  collaborationRequestId: string;

  @IsIn(
    [CollaborationRequestStatus.APPROVED, CollaborationRequestStatus.REJECTED],
    { message: 'INVALID_STATUS' },
  )
  readonly status: CollaborationRequestStatus;

  @IsString({ message: 'INVALID_FEEDBACK' })
  @Length(3, 255, { message: 'FEEDBACK_TOO_LONG' })
  readonly feedback: string;
}
