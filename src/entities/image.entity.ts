import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Idea } from './idea.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2048 })
  src: string;

  @Column({ type: 'varchar', length: 255 })
  alt: string;

  @Column({ nullable: true })
  @Index()
  ideaId: string | null;

  @ManyToOne(() => Idea, (idea) => idea.images, {
    onDelete: 'CASCADE',
  })
  idea: Idea | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(): ImageDto {
    const dto = new ImageDto();
    dto.id = this.id;
    dto.src = this.src;
    dto.alt = this.alt;
    dto.ideaId = this.ideaId;
    dto.createdAt = this.createdAt;
    dto.updatedAt = this.updatedAt;
    return dto;
  }
}

export class ImageDto {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  ideaId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
