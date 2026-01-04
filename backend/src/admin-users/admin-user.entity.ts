import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum AdminStatus {
  ACTIVE = 1,
  DISABLED = 0,
}

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ length: 50, nullable: true })
  realName?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ nullable: true })
  roleId: string;

  @Column({ length: 50, default: 'admin' })
  roleName: string;

  @Column({ type: 'int', default: AdminStatus.ACTIVE })
  status: AdminStatus;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ length: 50, nullable: true })
  lastLoginIp?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('admin_roles')
export class AdminRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 100, nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: '[]' })
  permissions: string[]; // 权限列表

  @Column({ type: 'int', default: 0 })
  sort: number; // 排序

  @Column({ type: 'int', default: AdminStatus.ACTIVE })
  status: AdminStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('admin_permissions')
export class AdminPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  code: string; // 权限代码 如 user:list, user:create

  @Column({ length: 50 })
  name: string; // 权限名称

  @Column({ length: 50, nullable: true })
  module?: string; // 所属模块

  @Column({ length: 100, nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('admin_operation_logs')
export class AdminOperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminId: string;

  @Column({ length: 50 })
  adminUsername: string;

  @Column({ length: 50 })
  module: string; // 操作模块

  @Column({ length: 50 })
  action: string; // 操作类型

  @Column({ type: 'text', nullable: true })
  content?: string; // 操作内容

  @Column({ length: 50, nullable: true })
  ip?: string;

  @Column({ length: 200, nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;
}

// DTOs
export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  roleId?: string;
}

export class UpdateAdminUserDto {
  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsEnum(AdminStatus)
  @IsOptional()
  status?: AdminStatus;
}

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CreateAdminRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  permissions?: string[];
}
