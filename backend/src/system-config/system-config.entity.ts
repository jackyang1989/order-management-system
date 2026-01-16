import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // 配置键，如 'user_registration_enabled'

  @Column({ type: 'text' })
  value: string; // 配置值（JSON字符串）

  @Column({ nullable: true })
  description: string; // 配置描述

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// DTOs
export class UpdateSystemConfigDto {
  @IsBoolean()
  userRegistrationEnabled: boolean; // 用户注册开关

  @IsBoolean()
  merchantRegistrationEnabled: boolean; // 商家注册开关
}

export class SystemConfigResponseDto {
  userRegistrationEnabled: boolean;
  merchantRegistrationEnabled: boolean;
}
