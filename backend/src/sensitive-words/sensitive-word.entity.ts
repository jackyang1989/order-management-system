import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// 敏感词类型
export enum SensitiveWordType {
  POLITICAL = 1, // 政治敏感
  PORN = 2, // 色情
  GAMBLING = 3, // 赌博
  FRAUD = 4, // 诈骗
  VIOLENCE = 5, // 暴力
  AD = 6, // 广告
  ABUSE = 7, // 辱骂
  CUSTOM = 99, // 自定义
}

// 处理级别
export enum SensitiveLevel {
  LOW = 1, // 低（提示）
  MEDIUM = 2, // 中（替换）
  HIGH = 3, // 高（拦截）
}

@Entity('sensitive_words')
@Index(['word'], { unique: true })
export class SensitiveWord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  word: string; // 敏感词

  @Column({ type: 'int', default: SensitiveWordType.CUSTOM })
  type: SensitiveWordType; // 类型

  @Column({ type: 'int', default: SensitiveLevel.MEDIUM })
  level: SensitiveLevel; // 处理级别

  @Column({ length: 100, nullable: true })
  replacement: string; // 替换词

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @Column({ default: 0 })
  hitCount: number; // 命中次数

  @Column({ type: 'text', nullable: true })
  remark: string; // 备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 敏感词检测日志
@Entity('sensitive_word_logs')
export class SensitiveWordLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string; // 用户ID

  @Column({ length: 50, nullable: true })
  scene: string; // 场景（注册、发布任务等）

  @Column({ type: 'text' })
  originalText: string; // 原始文本

  @Column({ type: 'jsonb' })
  matchedWords: string[]; // 匹配到的敏感词

  @Column({ type: 'int' })
  maxLevel: SensitiveLevel; // 最高敏感级别

  @Column({ default: false })
  blocked: boolean; // 是否被拦截

  @Column({ type: 'text', nullable: true })
  processedText: string; // 处理后文本

  @Column({ length: 50, nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}

// DTOs
export class CreateSensitiveWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;

  @IsEnum(SensitiveWordType)
  @IsOptional()
  type?: SensitiveWordType;

  @IsEnum(SensitiveLevel)
  @IsOptional()
  level?: SensitiveLevel;

  @IsString()
  @IsOptional()
  replacement?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class BatchImportDto {
  @IsString()
  @IsNotEmpty()
  words: string; // 换行分隔的词列表

  @IsEnum(SensitiveWordType)
  @IsOptional()
  type?: SensitiveWordType;

  @IsEnum(SensitiveLevel)
  @IsOptional()
  level?: SensitiveLevel;
}

export class CheckTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  scene?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class SensitiveWordFilterDto {
  @IsEnum(SensitiveWordType)
  @IsOptional()
  type?: SensitiveWordType;

  @IsEnum(SensitiveLevel)
  @IsOptional()
  level?: SensitiveLevel;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
