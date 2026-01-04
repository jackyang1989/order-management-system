import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  OTHER = 'other',
}

@Entity('operation_logs')
@Index(['module'])
@Index(['operatorId'])
@Index(['createdAt'])
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '操作模块' })
  module: string;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.OTHER,
    comment: '操作类型',
  })
  type: OperationType;

  @Column({ length: 200, comment: '操作描述' })
  action: string;

  @Column({ length: 50, nullable: true, comment: '操作人ID' })
  operatorId: string;

  @Column({ length: 50, nullable: true, comment: '操作人用户名' })
  operatorName: string;

  @Column({ length: 50, nullable: true, comment: 'IP地址' })
  ip: string;

  @Column({ length: 200, nullable: true, comment: 'User Agent' })
  userAgent: string;

  @Column({ type: 'text', nullable: true, comment: '请求参数' })
  requestData: string;

  @Column({ type: 'text', nullable: true, comment: '响应数据' })
  responseData: string;

  @Column({ default: true, comment: '是否成功' })
  success: boolean;

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage: string;

  @Column({ type: 'int', default: 0, comment: '执行时间(ms)' })
  duration: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}

// DTOs
export class QueryOperationLogDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsEnum(OperationType)
  type?: OperationType;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 20;
}

export class CreateOperationLogDto {
  @IsString()
  module: string;

  @IsEnum(OperationType)
  type: OperationType;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  requestData?: any;

  @IsOptional()
  responseData?: any;

  @IsOptional()
  success?: boolean;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  duration?: number;
}
