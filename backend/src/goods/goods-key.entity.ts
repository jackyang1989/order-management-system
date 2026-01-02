import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

/**
 * 商品关键词方案表 (对应原版 tfkz_goods_key)
 * 商家可以预先创建关键词方案，发布任务时直接选用
 */
@Entity('goods_keys')
export class GoodsKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    sellerId: string;           // 商家ID

    @Column({ type: 'int', default: 1 })
    type: number;               // 平台类型: 1淘宝 2天猫 3飞猪/京东

    @Column({ length: 50 })
    name: string;               // 方案名称

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/**
 * 商品关键词详情表 (对应原版 tfkz_goods_key_world)
 * 一个关键词方案可以包含多个关键词
 */
@Entity('goods_key_worlds')
export class GoodsKeyWorld {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    goodsKeyId: string;         // 关联关键词方案ID

    @Column({ length: 50 })
    keyWorld: string;           // 关键词内容

    @Column({ type: 'int', default: 1 })
    type: number;               // 类型: 1电脑端 2手机端

    @Column({ type: 'text', nullable: true })
    discount: string;           // 折扣服务 (逗号分隔)

    @Column({ length: 255, nullable: true })
    filter: string;             // 筛选分类 (逗号分隔)

    @Column({ length: 100, nullable: true })
    sort: string;               // 排序方式

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    maxPrice: number;           // 搜索最大价格

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    minPrice: number;           // 搜索最小价格

    @Column({ length: 50, nullable: true })
    province: string;           // 发货地（省）

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// ============ DTOs ============

/**
 * 关键词详情DTO
 */
export class GoodsKeyWorldDto {
    @IsString()
    keyWorld: string;

    @IsOptional()
    @IsNumber()
    type?: number;              // 1电脑端 2手机端

    @IsOptional()
    @IsArray()
    discount?: string[];        // 折扣服务数组

    @IsOptional()
    @IsArray()
    filter?: string[];          // 筛选分类数组

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

/**
 * 创建关键词方案DTO
 */
export class CreateGoodsKeyDto {
    @IsString()
    name: string;               // 方案名称

    @IsString()
    shopId: string;             // 店铺ID (用于确定平台类型)

    @IsArray()
    keyWold: GoodsKeyWorldDto[]; // 关键词列表
}

/**
 * 更新关键词方案DTO
 */
export class UpdateGoodsKeyDto {
    @IsString()
    id: string;                 // 方案ID

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsArray()
    keyWold?: GoodsKeyWorldDto[];
}

/**
 * 关键词方案筛选DTO
 */
export class GoodsKeyFilterDto {
    @IsOptional()
    @IsNumber()
    type?: number;              // 平台类型筛选

    @IsOptional()
    @IsString()
    shopId?: string;            // 按店铺筛选

    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;
}
