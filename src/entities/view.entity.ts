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

@Entity('views')
@Unique(['profileId', 'ideaId'])
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
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.views, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;
}
