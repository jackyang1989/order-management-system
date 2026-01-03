import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Tree, TreeChildren, TreeParent } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID } from 'class-validator';

// 分类类型
export enum CategoryType {
    GOODS = 1,        // 商品分类
    TASK = 2,         // 任务分类
    PLATFORM = 3,     // 平台分类（淘宝、京东、拼多多等）
    ARTICLE = 4,      // 文章分类
}

@Entity('categories')
@Tree('closure-table')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    @Index()
    type: CategoryType;  // 分类类型

    @Column({ length: 50 })
    name: string;  // 分类名称

    @Column({ length: 100, nullable: true })
    icon: string;  // 图标

    @Column({ length: 255, nullable: true })
    image: string;  // 分类图片

    @Column({ type: 'text', nullable: true })
    description: string;  // 描述

    @Column({ default: 0 })
    sort: number;  // 排序

    @Column({ default: true })
    isActive: boolean;  // 是否启用

    @Column({ default: 0 })
    level: number;  // 层级（0为顶级）

    @Column({ nullable: true })
    @Index()
    parentId: string;  // 父分类ID

    @TreeChildren()
    children: Category[];

    @TreeParent()
    parent: Category;

    @Column({ type: 'jsonb', nullable: true })
    extra: Record<string, any>;  // 额外配置

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateCategoryDto {
    @IsEnum(CategoryType)
    type: CategoryType;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    sort?: number;

    @IsUUID()
    @IsOptional()
    parentId?: string;
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    sort?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
