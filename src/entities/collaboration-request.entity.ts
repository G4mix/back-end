import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Idea } from './idea.entity';

export enum CollaborationRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('collaboration_requests')
export class CollaborationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ideaId: string;

  @Column()
  requesterId: string;

  @ManyToOne(() => Idea, (idea) => idea.collaborationRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idea_id' })
  idea: Idea;

  @ManyToOne(() => Profile, (profile) => profile.collaborationRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_id' })
  requester: Profile;

  @Column({
    type: 'enum',
    enum: CollaborationRequestStatus,
    default: CollaborationRequestStatus.PENDING,
  })
  status: CollaborationRequestStatus;

  @Column({ type: 'varchar', nullable: true })
  feedback: string | null;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  toDto(isRequester: boolean): CollaborationRequestDto {
    const collaborationRequest = new CollaborationRequestDto();
    collaborationRequest.status = this.status;
    collaborationRequest.feedback = this.feedback;
    collaborationRequest.message = this.message;
    collaborationRequest.ideaTitle = this.idea.title;
    collaborationRequest.requesterName = !isRequester
      ? this.requester.displayName
      : null;
    return collaborationRequest;
  }
}

export class CollaborationRequestDto {
  feedback: string | null;
  message: string;
  status: CollaborationRequestStatus;
  ideaTitle: string;
  requesterName: string | null;
}
