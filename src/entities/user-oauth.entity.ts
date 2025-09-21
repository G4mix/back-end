import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_oauth')
@Unique(['provider', 'email'])
@Index(['userId'])
export class UserOAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column({ unique: true })
  email: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.oauthAccounts, {
    onDelete: 'CASCADE',
  })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
