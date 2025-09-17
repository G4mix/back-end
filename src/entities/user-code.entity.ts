import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_codes')
export class UserCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 6 })
  code: string;

  @OneToOne(() => User, (user) => user.userCode)
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  toDto(): UserCodeDto {
    const dto = new UserCodeDto();
    dto.id = this.id;
    dto.code = this.code;
    dto.createdAt = this.created_at;
    return dto;
  }
}

export class UserCodeDto {
  id: string;
  code: string;
  createdAt: Date;
}
