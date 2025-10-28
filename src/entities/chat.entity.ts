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
  Index,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Idea } from './idea.entity';
import { CollaborationRequest } from './collaboration-request.entity';
import { Project } from './project.entity';

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

  @Column()
  @Index()
  projectId: string;

  @OneToOne(() => Project, (project) => project.chat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToMany(() => Profile, { cascade: true })
  @JoinTable({
    name: 'chat_members',
    joinColumn: { name: 'chat_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'profile_id', referencedColumnName: 'id' },
  })
  members: Profile[];

  @CreateDateColumn()
  createdAt: Date;

  toDto(currentUserId?: string, isListItem: boolean = false): ChatDto {
    const messages = isListItem ? this.messages.slice(-1) : this.messages;
    const otherMember = this.members?.find(
      (member) => member.id !== currentUserId,
    );
    const title = this.idea?.title ?? otherMember?.displayName ?? 'Chat';
    const image = this.idea?.images[0] ?? otherMember?.icon ?? null;

    return {
      id: this.id,
      title,
      image,
      messages,
      createdAt: this.createdAt,
    };
  }
}

export class ChatDto {
  id: string;
  title: string;
  image: string | null;
  messages: { senderId: string; content: string; timestamp: Date }[];
  createdAt: Date;
}
