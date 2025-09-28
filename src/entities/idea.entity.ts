import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { View } from './view.entity';
import { Tag } from './tag.entity';
import { Image } from './image.entity';

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 70, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 700, nullable: true })
  description: string | null;

  @Column()
  @Index()
  authorId: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.ideas, {
    onDelete: 'CASCADE',
  })
  author: UserProfile;

  @OneToMany(() => Comment, (comment) => comment.idea)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.idea)
  likes: Like[];

  @OneToMany(() => View, (view) => view.idea)
  views: View[];

  @OneToMany(() => Tag, (tag) => tag.idea)
  tags: Tag[];

  @OneToMany(() => Image, (image) => image.idea)
  images: Image[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(currentUserId?: string): IdeaDto {
    const dto = new IdeaDto();
    dto.id = this.id;
    dto.title = this.title;
    dto.description = this.description;
    dto.author = this.author?.toDto(currentUserId);
    dto.comments = this.comments?.length ?? 0;
    dto.likes = this.likes?.length ?? 0;
    dto.views = this.views?.length ?? 0;
    dto.tags = this.tags?.map((tag) => tag.name) ?? [];
    dto.images =
      this.images?.map((image) => ({
        id: image.id,
        src: image.src,
        alt: image.alt,
        width: image.width,
        height: image.height,
      })) ?? [];
    dto.isLiked = currentUserId
      ? this.likes?.some((like) => like.userProfileId === currentUserId)
      : false;
    dto.createdAt = this.createdAt;
    dto.updatedAt = this.updatedAt;
    return dto;
  }
}

export class IdeaDto {
  id: string;
  title: string | null;
  description: string | null;
  author: any; // UserProfileDto
  comments: number;
  likes: number;
  views: number;
  tags: string[];
  images: {
    id: string;
    src: string;
    alt: string;
    width: number;
    height: number;
  }[];
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
