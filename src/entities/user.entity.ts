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
import { UserCode, UserCodeDto } from './user-code.entity';
import { UserProfile, UserProfileDto } from './user-profile.entity';
import { UserOAuth } from './user-oauth.entity';

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

  @Column({ unique: true, name: 'user_code_id' })
  userCodeId: string;

  @OneToOne(() => UserCode, (userCode) => userCode.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_code_id' })
  userCode: UserCode;

  @Column({ unique: true, name: 'user_profile_id' })
  userProfileId: string;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_profile_id' })
  userProfile: UserProfile;

  @Column({ type: 'varchar', unique: true, nullable: true })
  refreshToken: string | null;

  @OneToMany(() => UserOAuth, (oauth) => oauth.user)
  oauthAccounts: UserOAuth[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  toDto(currentUserId?: string): UserDto {
    const dto = new UserDto();
    dto.id = this.id;
    dto.username = this.username;
    dto.email = this.email;
    dto.verified = this.verified;
    dto.userProfile = this.userProfile?.toDto(currentUserId);
    dto.userCode = this.userCode?.toDto() || null;
    return dto;
  }
}

export class UserDto {
  id: string;
  username: string;
  email: string;
  verified: boolean;
  userProfile: UserProfileDto;
  userCode: UserCodeDto | null;
}
