import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserProfile, UserProfileDto } from './user-profile.entity';
import { Idea } from './idea.entity';
import { Like } from './like.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  content: string;

  @Column()
  @Index()
  ideaId: string;

  @ManyToOne(() => Idea, (idea) => idea.comments, {
    onDelete: 'CASCADE',
  })
  idea: Idea;

  @Column({ nullable: true })
  @Index()
  parentCommentId: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'RESTRICT',
  })
  parentComment: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @Column()
  @Index()
  authorId: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.comments, {
    onDelete: 'CASCADE',
  })
  author: UserProfile;

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(currentUserId?: string): CommentDto {
    const dto = new CommentDto();
    dto.id = this.id;
    dto.content = this.content;
    dto.author = this.author?.toDto(currentUserId);
    dto.ideaId = this.ideaId;
    dto.parentCommentId = this.parentCommentId;
    dto.likes = this.likes?.length ?? 0;
    dto.replies =
      this.replies?.map((reply) => reply.toDto(currentUserId)) ?? [];
    dto.isLiked = currentUserId
      ? this.likes?.some((like) => like.userProfileId === currentUserId)
      : false;
    dto.createdAt = this.createdAt;
    dto.updatedAt = this.updatedAt;
    return dto;
  }
}

export class CommentDto {
  id: string;
  content: string;
  author: UserProfileDto;
  ideaId: string;
  parentCommentId: string | null;
  likes: number;
  replies: CommentDto[];
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
