import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { Link } from './link.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  autobiography: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  backgroundImage: string | null;

  @OneToOne(() => User, (user) => user.userProfile)
  user: User;

  @OneToMany(() => Link, (link) => link.userProfile)
  links: Link[];

  // Seguidores (quem me segue)
  @OneToMany(() => Follow, (follow) => follow.followingUser)
  followers: Follow[];

  // Seguindo (quem eu sigo)
  @OneToMany(() => Follow, (follow) => follow.followerUser)
  following: Follow[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
