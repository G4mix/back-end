import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';

@Entity('follows')
@Unique(['followerUserId', 'followingUserId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  followerUserId: string;

  @Column({ nullable: true })
  followingUserId: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.following, {
    onDelete: 'CASCADE',
  })
  followerUser: UserProfile;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.followers, {
    onDelete: 'CASCADE',
  })
  followingUser: UserProfile;

  @CreateDateColumn()
  created_at: Date;
}
