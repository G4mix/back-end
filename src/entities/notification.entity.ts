import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

export enum NotificationType {
  INVITE = 'Invite',
  COMMENT = 'Comment',
  LIKE = 'Like',
  FOLLOW = 'Follow',
}

export enum RelatedEntityType {
  COLLABORATION_REQUEST = 'COLLABORATION_REQUEST',
  IDEA = 'IDEA',
  COMMENT = 'COMMENT',
  PROJECT = 'PROJECT',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userProfileId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 300 })
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ nullable: true })
  actorProfileId: string | null;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityId: string | null;

  @Column({
    type: 'enum',
    enum: RelatedEntityType,
    nullable: true,
  })
  relatedEntityType: RelatedEntityType | null;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: Profile;

  @ManyToOne(() => Profile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_profile_id' })
  actorProfile: Profile | null;

  @CreateDateColumn()
  createdAt: Date;

  toDto(
    ideaTitle?: string,
    ideaId?: string,
    requesterId?: string,
  ): NotificationDto {
    const dto = new NotificationDto();
    dto.id = this.id;
    dto.type = this.type;
    dto.title = this.title;
    dto.message = this.message;
    dto.readAt = this.readAt;
    dto.createdAt = this.createdAt;
    dto.read = this.readAt !== null;
    dto.actorProfileId = this.actorProfileId;
    dto.actorProfile = this.actorProfile ? this.actorProfile.toDto() : null;
    dto.relatedEntityId = this.relatedEntityId;
    dto.relatedEntityType = this.relatedEntityType;
    if (ideaTitle) dto.ideaTitle = ideaTitle;
    if (ideaId) dto.ideaId = ideaId;
    if (requesterId) dto.requesterId = requesterId;
    return dto;
  }
}

export class NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  actorProfileId: string | null;
  actorProfile: {
    id: string;
    displayName: string;
    icon?: string | null;
    autobiography?: string | null;
    backgroundImage?: string | null;
    links: string[];
    followers: number;
    following: number;
    isFollowing: boolean;
    user: {
      id: string;
      email: string;
      username: string;
      verified: boolean;
    } | null;
  } | null;
  relatedEntityId: string | null;
  relatedEntityType: RelatedEntityType | null;
  ideaId?: string;
  ideaTitle?: string;
  requesterId?: string;
}
