import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Profile, ProfileDto } from './profile.entity';
import { Idea, IdeaDto } from './idea.entity';
import {
  CollaborationRequest,
  CollaborationRequestDto,
} from './collaboration-request.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', default: [] })
  messages: { senderId: string; content: string; timestamp: Date }[];

  @Column({ nullable: true })
  ownerId: string | null;

  @ManyToOne(() => Profile, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Profile;

  @Column({ nullable: true })
  ideaId: string | null;

  @ManyToOne(() => Idea, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idea_id' })
  idea: Idea;

  @Column({ nullable: true })
  collaborationRequestId: string | null;

  @OneToOne(() => CollaborationRequest, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collaboration_request_id' })
  collaborationRequest: CollaborationRequest;

  @ManyToMany(() => Profile, { cascade: true })
  @JoinTable({
    name: 'chat_members',
    joinColumn: { name: 'chat_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'profile_id', referencedColumnName: 'id' },
  })
  members: Profile[];

  @CreateDateColumn()
  createdAt: Date;

  toDto(currentUserId?: string): ChatDto {
    const dto = new ChatDto();
    dto.id = this.id;
    dto.messages = this.messages ?? [];
    dto.owner = this.owner?.toDto(currentUserId) ?? null;
    dto.idea = this.idea?.toDto(currentUserId) ?? null;
    dto.collaborationRequest = this.collaborationRequest?.toDto(false) ?? null;
    dto.members =
      this.members?.map((member) => member.toDto(currentUserId)) ?? [];
    dto.createdAt = this.createdAt;
    return dto;
  }
}

export class ChatDto {
  id: string;
  messages: { senderId: string; content: string; timestamp: Date }[];
  owner: ProfileDto | null;
  idea: IdeaDto | null;
  collaborationRequest: CollaborationRequestDto | null;
  members: ProfileDto[];
  createdAt: Date;
}
