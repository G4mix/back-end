import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User, UserDto } from './user.entity';
import { Follow } from './follow.entity';
import { Link } from './link.entity';
import { Idea } from './idea.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { View } from './view.entity';

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

  @OneToOne(() => User, (user) => user.userProfile, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Link, (link) => link.userProfile)
  links: Link[];

  @OneToMany(() => Follow, (follow) => follow.followingUser)
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.followerUser)
  following: Follow[];

  @OneToMany(() => Idea, (idea) => idea.author)
  ideas: Idea[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.userProfile)
  likes: Like[];

  @OneToMany(() => View, (view) => view.userProfile)
  views: View[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(currentUserId?: string): UserProfileDto {
    const dto = new UserProfileDto();
    dto.id = this.id;
    dto.displayName = this.displayName ?? this.user.username;
    dto.autobiography = this.autobiography ?? null;
    dto.backgroundImage = this.backgroundImage ?? null;
    dto.icon = this.icon ?? null;
    dto.links = this.links?.map((l) => l.url) || [];
    dto.followers = this.followers?.length ?? 0;
    dto.following = this.following?.length ?? 0;
    dto.isFollowing = currentUserId
      ? this.followers?.some((f) => f.followerUserId === currentUserId)
      : false;
    dto.user = this.user?.toDto();
    return dto;
  }
}

export class UserProfileDto {
  id: string;
  displayName: string;
  autobiography?: string | null;
  icon?: string | null;
  backgroundImage?: string | null;
  links: string[] = [];
  isFollowing: boolean;
  followers: number = 0;
  following: number = 0;
  user: UserDto;
}
