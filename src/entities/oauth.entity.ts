import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum OAuthProvider {
  GOOGLE = 'Google',
  GITHUB = 'Github',
  LINKEDIN = 'LinkedIn',
}

@Entity('oauth')
@Unique(['provider', 'email'])
@Index(['userId'])
export class OAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider: OAuthProvider;

  @Column({ unique: true })
  email: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.oauth, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
