import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Platform } from './platform.entity';

/**
 * 平台截图要求配置表
 * 管理员可以为每个平台配置需要上传的截图
 */
@Entity('platform_image_requirements')
export class PlatformImageRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'platformId' })
  platformId: string; // 关联 Platform.id

  @Column()
  key: string; // 内部键名: 'profileImg', 'authImg' 等

  @Column()
  label: string; // 显示名称: '账号主页截图', '实名认证截图'

  @Column({ nullable: true })
  exampleImagePath: string; // 示例图片存储路径

  @Column({ nullable: true, type: 'text' })
  pathHint: string; // 页面路径提示,如 '我的淘宝 > 账号信息'

  @Column({ type: 'boolean', default: true })
  required: boolean; // 是否必填

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // 显示顺序

  @ManyToOne(() => Platform)
  @JoinColumn({ name: 'platformId' })
  platform: Platform;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 创建截图配置 DTO
 */
export class CreateImageRequirementDto {
  platformId: string;
  key: string;
  label: string;
  exampleImagePath?: string;
  pathHint?: string;
  required?: boolean;
  sortOrder?: number;
}

/**
 * 更新截图配置 DTO
 */
export class UpdateImageRequirementDto {
  label?: string;
  exampleImagePath?: string;
  pathHint?: string;
  required?: boolean;
  sortOrder?: number;
}
