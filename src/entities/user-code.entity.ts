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

  @Column({ type: 'varchar', length: 6, nullable: true })
  code: string | null;

  @OneToOne(() => User, (user) => user.userCode)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toDto(): UserCodeDto {
    const dto = new UserCodeDto();
    dto.id = this.id;
    dto.code = this.code ?? null;
    dto.createdAt = this.createdAt;
    return dto;
  }
}

export class UserCodeDto {
  id: string;
  code: string | null;
  createdAt: Date;
}
