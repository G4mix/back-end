import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Idea } from './idea.entity';
import { Comment } from './comment.entity';

@Entity('likes')
@Unique(['userProfileId', 'ideaId'])
@Unique(['userProfileId', 'commentId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  ideaId: string | null;

  @ManyToOne(() => Idea, (idea) => idea.likes, {
    onDelete: 'CASCADE',
  })
  idea: Idea | null;

  @Column({ nullable: true })
  @Index()
  commentId: string | null;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  comment: Comment | null;

  @Column()
  @Index()
  userProfileId: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.likes, {
    onDelete: 'CASCADE',
  })
  userProfile: UserProfile;

  @CreateDateColumn()
  createdAt: Date;

  toDto(): LikeDto {
    const dto = new LikeDto();
    dto.id = this.id;
    dto.ideaId = this.ideaId;
    dto.commentId = this.commentId;
    dto.userProfileId = this.userProfileId;
    dto.createdAt = this.createdAt;
    return dto;
  }
}

export class LikeDto {
  id: string;
  ideaId: string | null;
  commentId: string | null;
  userProfileId: string;
  createdAt: Date;
}
