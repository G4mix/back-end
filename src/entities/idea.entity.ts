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
import { Profile, ProfileDto } from './profile.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { View } from './view.entity';
import { Tag } from './tag.entity';

@Entity('ideas')
export class Idea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 70 })
  title: string;

  @Column({ type: 'varchar', length: 700 })
  content: string;

  @Column()
  @Index()
  authorId: string;

  @ManyToOne(() => Profile, (profile) => profile.ideas, {
    onDelete: 'CASCADE',
  })
  author: Profile;

  @OneToMany(() => Comment, (comment) => comment.idea)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.idea)
  likes: Like[];

  @OneToMany(() => View, (view) => view.idea)
  views: View[];

  @Column({ type: 'jsonb', default: [] })
  links: string[];

  @OneToMany(() => Tag, (tag) => tag.idea, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  tags: Tag[];

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(currentUserId?: string): IdeaDto {
    const dto = new IdeaDto();
    dto.id = this.id;
    dto.title = this.title;
    dto.content = this.content;
    dto.author = this.author?.toDto(currentUserId);
    dto.comments = this.comments?.length ?? 0;
    dto.likes = this.likes?.length ?? 0;
    dto.views = this.views?.length ?? 0;
    dto.links = this.links ?? [];
    dto.tags = this.tags?.map((tag) => tag.name) ?? [];
    dto.images = this.images ?? [];
    dto.isLiked = currentUserId
      ? this.likes?.some((like) => like.userProfileId === currentUserId)
      : false;
    dto.isViewed = currentUserId
      ? this.views?.some((view) => view.userProfileId === currentUserId)
      : false;
    dto.createdAt = this.createdAt;
    dto.updatedAt = this.updatedAt;
    return dto;
  }
}

export class IdeaDto {
  id: string;
  title: string;
  content: string;
  author?: ProfileDto;
  comments: number;
  likes: number;
  views: number;
  links: string[];
  tags: string[];
  images: string[];
  isLiked: boolean;
  isViewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
