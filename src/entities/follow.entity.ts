import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('follows')
@Unique(['followerUserId', 'followingUserId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  followerUserId: string;

  @Column()
  followingUserId: string;

  @ManyToOne(() => Profile, (profile) => profile.following, {
    onDelete: 'CASCADE',
  })
  followerUser: Profile;

  @ManyToOne(() => Profile, (profile) => profile.followers, {
    onDelete: 'CASCADE',
  })
  followingUser: Profile;

  @CreateDateColumn()
  createdAt: Date;
}
