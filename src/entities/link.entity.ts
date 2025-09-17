import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';

@Entity('links')
export class Link {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 700 })
  url: string;

  @Column({ length: 100, nullable: true })
  label: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.links, {
    onDelete: 'CASCADE',
  })
  userProfile: UserProfile;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
