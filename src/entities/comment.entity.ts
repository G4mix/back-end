import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Profile, ProfileDto } from './profile.entity';
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
  @JoinColumn({ name: 'idea_id' })
  idea: Idea;

  @Column({ nullable: true })
  @Index()
  parentCommentId: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @Column()
  @Index()
  authorId: string;

  @ManyToOne(() => Profile, (profile) => profile.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author: Profile;

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;

  toDto(currentUserId?: string): CommentDto {
    const dto = new CommentDto();
    dto.id = this.id;
    dto.content = this.content;
    dto.author = this.author?.toDto(currentUserId);
    dto.ideaId = this.ideaId;
    dto.parentCommentId = this.parentCommentId;
    dto.likes = this.likes?.length ?? 0;
    dto.replies = this.replies?.length ?? 0;
    dto.isLiked = currentUserId
      ? this.likes?.some((like) => like.profileId === currentUserId)
      : false;
    dto.createdAt = this.createdAt;
    return dto;
  }
}

export class CommentDto {
  id: string;
  content: string;
  author: ProfileDto;
  ideaId: string;
  parentCommentId: string | null;
  likes: number;
  replies: number;
  isLiked: boolean;
  createdAt: Date;
}
