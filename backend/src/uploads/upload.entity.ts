import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';

// 文件类型
export enum FileType {
  IMAGE = 'image', // 图片
  VIDEO = 'video', // 视频
  DOCUMENT = 'document', // 文档
  OTHER = 'other', // 其他
}

// 文件用途
export enum FileUsage {
  AVATAR = 'avatar', // 头像
  ID_CARD = 'id_card', // 身份证
  BANK_CARD = 'bank_card', // 银行卡
  ORDER_PROOF = 'order_proof', // 订单凭证
  TASK_IMAGE = 'task_image', // 任务图片
  GOODS_IMAGE = 'goods_image', // 商品图片
  SCREENSHOT = 'screenshot', // 截图
  CHAT = 'chat', // 聊天图片
  OTHER = 'other', // 其他
}

// 存储类型
export enum StorageType {
  LOCAL = 'local', // 本地存储
  OSS = 'oss', // 阿里云OSS
  COS = 'cos', // 腾讯云COS
  QINIU = 'qiniu', // 七牛云
}

@Entity('uploaded_files')
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  originalName: string; // 原始文件名

  @Column({ length: 255 })
  fileName: string; // 存储文件名

  @Column({ length: 500 })
  @Index()
  path: string; // 文件路径

  @Column({ length: 500 })
  url: string; // 访问URL

  @Column({ length: 20 })
  type: FileType; // 文件类型

  @Column({ length: 100 })
  mimeType: string; // MIME类型

  @Column({ type: 'bigint' })
  size: number; // 文件大小(字节)

  @Column({ length: 20, default: StorageType.LOCAL })
  storage: StorageType; // 存储类型

  @Column({ length: 30, nullable: true })
  usage: FileUsage; // 用途

  @Column({ nullable: true })
  @Index()
  uploaderId: string; // 上传者ID

  @Column({ length: 20, nullable: true })
  uploaderType: string; // 上传者类型

  @Column({ nullable: true })
  relatedId: string; // 关联ID

  @Column({ length: 50, nullable: true })
  relatedType: string; // 关联类型

  @Column({ length: 64, nullable: true })
  @Index()
  md5: string; // 文件MD5（用于去重）

  @Column({ type: 'int', nullable: true })
  width: number; // 图片宽度

  @Column({ type: 'int', nullable: true })
  height: number; // 图片高度

  @Column({ default: false })
  isDeleted: boolean; // 是否已删除

  @CreateDateColumn()
  createdAt: Date;
}

// 文件分组（相册、文件夹）
@Entity('file_groups')
export class FileGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // 用户ID

  @Column({ length: 50 })
  name: string; // 分组名称

  @Column({ default: 0 })
  fileCount: number; // 文件数量

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;
}

// DTOs
export class UploadFileDto {
  @IsString()
  @IsOptional()
  uploaderId?: string;

  @IsString()
  @IsOptional()
  uploaderType?: string;

  @IsEnum(FileUsage)
  @IsOptional()
  usage?: FileUsage;

  @IsString()
  @IsOptional()
  relatedId?: string;

  @IsString()
  @IsOptional()
  relatedType?: string;
}

export class FileFilterDto {
  @IsEnum(FileType)
  @IsOptional()
  type?: FileType;

  @IsEnum(FileUsage)
  @IsOptional()
  usage?: FileUsage;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
