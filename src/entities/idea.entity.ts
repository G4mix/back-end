import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Profile, ProfileDto } from './profile.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { View } from './view.entity';
import { Tag } from './tag.entity';
import { CollaborationRequest } from './collaboration-request.entity';
import { Chat } from './chat.entity';

export enum IdeaStatus {
  CLOSED = 'Closed',
  OPEN = 'Open',
  CANCELED = 'Canceled',
}

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 70 })
  title: string;

  @Column({ type: 'varchar', length: 700 })
  content: string;

  @Column()
  @Index()
  authorId: string;

  @Column({ type: 'enum', enum: IdeaStatus, default: IdeaStatus.OPEN })
  status: IdeaStatus;

  @ManyToOne(() => Profile, (profile) => profile.ideas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author: Profile;

  @OneToMany(() => Comment, (comment) => comment.idea, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  comments: Comment[];

  @OneToMany(() => CollaborationRequest, (req) => req.idea)
  collaborationRequests: CollaborationRequest[];

  @OneToMany(() => Like, (like) => like.idea)
  likes: Like[];

  @OneToMany(() => View, (view) => view.idea)
  views: View[];

  @Column({ type: 'jsonb', default: [] })
  links: string[];

  @OneToMany(() => Tag, (tag) => tag.idea)
  tags: Tag[];

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @OneToMany(() => Chat, (chat) => chat.idea, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  chats: Chat[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(currentUserId?: string): IdeaDto {
    const dto = new IdeaDto();
    dto.id = this.id;
    dto.title = this.title;
    dto.content = this.content;
    dto.author = this.author?.toDto(currentUserId);
    dto.comments = this.comments?.length ?? 0;
    dto.likes = this.likes?.length ?? 0;
    dto.views = this.views?.length ?? 0;
    dto.links = this.links ?? [];
    dto.tags = this.tags?.map((tag) => tag.name) ?? [];
    dto.images = this.images ?? [];
    dto.isLiked = currentUserId
      ? this.likes?.some((like) => like.profileId === currentUserId)
      : false;
    dto.isViewed = currentUserId
      ? this.views?.some((view) => view.profileId === currentUserId)
      : false;
    dto.createdAt = this.createdAt;
    dto.updatedAt = this.updatedAt;
    return dto;
  }
}

export class IdeaDto {
  id: string;
  title: string;
  content: string;
  author?: ProfileDto;
  comments: number;
  likes: number;
  views: number;
  links: string[];
  tags: string[];
  images: string[];
  isLiked: boolean;
  isViewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
