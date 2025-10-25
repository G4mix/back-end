import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Profile } from './profile.entity';
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

  @ManyToOne(() => Profile, (profile) => profile.likes, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;
}
