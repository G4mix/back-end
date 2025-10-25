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

@Entity('views')
@Unique(['userProfileId', 'ideaId'])
export class View {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  ideaId: string;

  @ManyToOne(() => Idea, (idea) => idea.views, {
    onDelete: 'CASCADE',
  })
  idea: Idea;

  @Column()
  @Index()
  userProfileId: string;

  @ManyToOne(() => Profile, (profile) => profile.views, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;
}
