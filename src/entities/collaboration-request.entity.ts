import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
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
@Unique(['idea', 'requester'])
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
  idea: string;

  @ManyToOne(() => Profile, (profile) => profile.collaborationRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_id' })
  requester: string;

  @Column({
    type: 'enum',
    enum: CollaborationRequestStatus,
    default: CollaborationRequestStatus.PENDING,
  })
  status: CollaborationRequestStatus;

  @Column()
  feedback: string;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
