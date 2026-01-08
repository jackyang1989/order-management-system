import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 帮助中心文章类型
 */
export enum ArticleType {
  ANNOUNCEMENT = 'announcement', // 公告
  FAQ = 'faq', // 常见问题
  GUIDE = 'guide', // 使用指南
}

/**
 * 帮助中心文章实体
 */
@Entity('help_articles')
export class HelpArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string; // Markdown 格式内容

  @Column({
    type: 'varchar',
    default: ArticleType.FAQ,
  })
  type: ArticleType;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 创建文章 DTO
 */
export class CreateHelpArticleDto {
  title: string;
  content: string;
  type?: ArticleType;
  sortOrder?: number;
  isPublished?: boolean;
}

/**
 * 更新文章 DTO
 */
export class UpdateHelpArticleDto {
  title?: string;
  content?: string;
  type?: ArticleType;
  sortOrder?: number;
  isPublished?: boolean;
}
