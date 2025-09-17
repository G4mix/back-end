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

  @OneToMany(() => Follow, (follow) => follow.followingUser)
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.followerUser)
  following: Follow[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  toDto(currentUserId?: string): UserProfileDto {
    const dto = new UserProfileDto();
    dto.id = this.id;
    dto.username = this.displayName ?? this.id;
    dto.bio = this.autobiography ?? null;
    dto.avatarUrl = this.icon ?? null;
    dto.links =
      this.links?.map((l) => ({
        id: l.id,
        url: l.url,
        label: l.label ?? '',
      })) || [];
    dto.followers = this.followers?.length ?? 0;
    dto.following = this.following?.length ?? 0;
    dto.isFollowing = currentUserId
      ? this.followers?.some((f) => f.followerUserId === currentUserId)
      : undefined;
    return dto;
  }
}

export class UserProfileDto {
  id: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  links: { id: string; url: string; label: string }[] = [];
  isFollowing?: boolean;
  followers: number = 0;
  following: number = 0;
}
