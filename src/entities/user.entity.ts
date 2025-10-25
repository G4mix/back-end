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
import { Profile } from './profile.entity';
import { OAuth } from './oauth.entity';

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

  @Column({ length: 6, nullable: true })
  code: string;

  @Column({ unique: true })
  profileId: string;

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ type: 'varchar', unique: true, nullable: true })
  refreshToken: string | null;

  @OneToMany(() => OAuth, (oauth) => oauth.user)
  oauth: OAuth[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(): UserDto {
    const dto = new UserDto();
    dto.id = this.id;
    dto.username = this.username;
    dto.email = this.email;
    dto.verified = this.verified;
    return dto;
  }
}

export class UserDto {
  id: string;
  username: string;
  email: string;
  verified: boolean;
}
