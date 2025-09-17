import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserCode } from './user-code.entity';
import { UserProfile } from './user-profile.entity';
import { UserOAuth } from './user-oauth.entity';
import { UserDto } from 'src/shared/user.dto';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 320, unique: true })
  email: string;

  @Column({ length: 60 })
  password: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  blockedUntil: Date | null;

  // UserCode
  @Column({ unique: true })
  userCodeId: string;

  @OneToOne(() => UserCode, (userCode) => userCode.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userCodeId' })
  userCode: UserCode;

  // UserProfile
  @Column({ unique: true })
  userProfileId: string;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userProfileId' })
  userProfile: UserProfile;

  @Column({ type: 'varchar', unique: true, nullable: true })
  refreshTokenId: string | null;

  @OneToMany(() => UserOAuth, (oauth) => oauth.user)
  oauthAccounts: UserOAuth[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  toDto(currentUserId?: string): UserDto {
    return UserDto.fromEntity(this, currentUserId);
  }
}
