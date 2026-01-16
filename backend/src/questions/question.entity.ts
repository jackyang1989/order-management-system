import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';
import { Shop } from '../shops/shop.entity';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

// ============ 问题模板方案表 ============
@Entity('question_schemes')
export class QuestionScheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sellerId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'sellerId' })
  seller: Merchant;

  @Column({ nullable: true })
  @Index()
  shopId: string; // 关联的店铺ID

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column({ length: 100 })
  name: string; // 方案名称

  @Column({ type: 'text', nullable: true })
  description: string; // 方案描述

  @OneToMany(() => QuestionDetail, (detail) => detail.questionScheme, {
    cascade: true,
  })
  details: QuestionDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============ 问题模板详情表 ============
@Entity('question_details')
export class QuestionDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  questionSchemeId: string;

  @ManyToOne(() => QuestionScheme, (scheme) => scheme.details)
  @JoinColumn({ name: 'questionSchemeId' })
  questionScheme: QuestionScheme;

  @Column({ length: 100 })
  name: string; // 问题模板名称（如：询问发货时间、询问优惠活动）

  @Column({ type: 'jsonb' })
  questions: string[]; // 多个连续问题，存储为JSON数组

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============ DTOs ============
export class CreateQuestionDetailDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  questions: string[];
}

export class CreateQuestionSchemeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shopId?: string; // 关联的店铺ID
}

export class UpdateQuestionSchemeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shopId?: string;
}

export class UpdateQuestionDetailDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questions?: string[];
}
