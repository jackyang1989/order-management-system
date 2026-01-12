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
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 关键词方案平台类型
export enum KeywordPlatform {
  TAOBAO = 1,
  TMALL = 2,
  FEIZHU = 3,
}

// 关键词搜索端类型
export enum KeywordTerminal {
  PC = 1,
  MOBILE = 2,
}

// ============ 关键词方案表 ============
@Entity('goods_keys')
export class GoodsKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sellerId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'sellerId' })
  seller: Merchant;

  @Column({ length: 100 })
  name: string; // 方案名称

  @Column({ type: 'text', nullable: true })
  description: string; // 方案描述

  @Column({ type: 'int', default: KeywordPlatform.TAOBAO })
  platform: KeywordPlatform; // 平台 1淘宝 2天猫 3飞猪

  @OneToMany(() => KeywordDetail, (detail) => detail.goodsKey, {
    cascade: true,
  })
  details: KeywordDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============ 关键词详情表 ============
@Entity('keyword_details')
export class KeywordDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  goodsKeyId: string;

  @ManyToOne(() => GoodsKey, (key) => key.details)
  @JoinColumn({ name: 'goodsKeyId' })
  goodsKey: GoodsKey;

  @Column({ length: 100 })
  keyword: string; // 关键词

  @Column({ type: 'int', default: KeywordTerminal.PC })
  terminal: KeywordTerminal; // 类型 1电脑端 2手机端

  @Column({ type: 'text', nullable: true })
  discount: string; // 折扣服务 (JSON)

  @Column({ length: 225, nullable: true })
  filter: string; // 筛选分类

  @Column({ length: 100, nullable: true })
  sort: string; // 排序方式

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  maxPrice: number; // 最大价格

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  minPrice: number; // 最小价格

  @Column({ length: 50, nullable: true })
  province: string; // 发货地（省）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============ DTOs ============
export class CreateKeywordDetailDto {
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @IsOptional()
  @IsEnum(KeywordTerminal)
  terminal?: KeywordTerminal;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsString()
  province?: string;
}

export class CreateGoodsKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(KeywordPlatform)
  platform?: KeywordPlatform;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateKeywordDetailDto)
  details?: CreateKeywordDetailDto[];
}

export class UpdateGoodsKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(KeywordPlatform)
  platform?: KeywordPlatform;
}

export class UpdateKeywordDetailDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(KeywordTerminal)
  terminal?: KeywordTerminal;

  @IsOptional()
  @IsString()
  discount?: string;

  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsString()
  province?: string;
}
