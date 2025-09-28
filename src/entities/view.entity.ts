import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Idea } from './idea.entity';

@Entity('views')
@Unique(['userProfileId', 'ideaId'])
export class View {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  ideaId: string;

  @ManyToOne(() => Idea, (idea) => idea.views, {
    onDelete: 'CASCADE',
  })
  idea: Idea;

  @Column()
  @Index()
  userProfileId: string;

  @ManyToOne(() => UserProfile, (userProfile) => userProfile.views, {
    onDelete: 'CASCADE',
  })
  userProfile: UserProfile;

  @CreateDateColumn()
  createdAt: Date;

  toDto(): ViewDto {
    const dto = new ViewDto();
    dto.id = this.id;
    dto.ideaId = this.ideaId;
    dto.userProfileId = this.userProfileId;
    dto.createdAt = this.createdAt;
    return dto;
  }
}

export class ViewDto {
  id: string;
  ideaId: string;
  userProfileId: string;
  createdAt: Date;
}
