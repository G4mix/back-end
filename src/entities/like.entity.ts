import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Idea } from './idea.entity';
import { Comment } from './comment.entity';

@Entity('likes')
@Unique(['profileId', 'ideaId'])
@Unique(['profileId', 'commentId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  ideaId: string | null;

  @ManyToOne(() => Idea, (idea) => idea.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idea_id' })
  idea: Idea | null;

  @Column({ nullable: true })
  @Index()
  commentId: string | null;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment | null;

  @Column()
  @Index()
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;
}
