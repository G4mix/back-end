import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { User, UserDto } from './user.entity';
import { Follow } from './follow.entity';
import { Idea } from './idea.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { View } from './view.entity';
import { CollaborationRequest } from './collaboration-request.entity';
import { Chat } from './chat.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  displayName: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  autobiography: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  backgroundImage: string | null;

  @OneToOne(() => User, (user) => user.profile)
  user: User;

  @Column({ type: 'jsonb', default: [] })
  links: string[];

  @OneToMany(() => Follow, (follow) => follow.followingUser, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.followerUser, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  following: Follow[];

  @OneToMany(() => Idea, (idea) => idea.author, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  ideas: Idea[];

  @OneToMany(() => CollaborationRequest, (req) => req.requester)
  collaborationRequests: CollaborationRequest[];

  @OneToMany(() => Comment, (comment) => comment.author, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.profile, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  likes: Like[];

  @OneToMany(() => View, (view) => view.profile, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  views: View[];

  @ManyToMany(() => Chat, (chat) => chat.members)
  chats: Chat[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(currentUserId?: string): ProfileDto {
    const dto = new ProfileDto();
    dto.id = this.id;
    dto.displayName = this.displayName;
    dto.autobiography = this.autobiography ?? null;
    dto.backgroundImage = this.backgroundImage ?? null;
    dto.icon = this.icon ?? null;
    dto.links = this.links ?? [];
    dto.followers = this.followers?.length ?? 0;
    dto.following = this.following?.length ?? 0;
    dto.isFollowing = currentUserId
      ? this.followers?.some((f) => f.followerUserId === currentUserId)
      : false;
    dto.user = this.user?.toDto();
    return dto;
  }
}

export class ProfileDto {
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
