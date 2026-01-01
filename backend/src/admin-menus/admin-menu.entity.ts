import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Tree, TreeChildren, TreeParent } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export enum MenuType {
    DIRECTORY = 'directory',  // 目录
    MENU = 'menu',           // 菜单
    BUTTON = 'button',       // 按钮/权限
}

export enum MenuStatus {
    ACTIVE = 1,
    DISABLED = 0,
}

@Entity('admin_menus')
@Tree('materialized-path')
export class AdminMenu {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    name: string;  // 菜单名称

    @Column({ length: 100, nullable: true })
    path?: string;  // 路由路径

    @Column({ length: 100, nullable: true })
    component?: string;  // 组件路径

    @Column({ length: 50, nullable: true })
    icon?: string;  // 图标

    @Column({
        type: 'enum',
        enum: MenuType,
        default: MenuType.MENU,
    })
    type: MenuType;

    @Column({ length: 50, nullable: true })
    permission?: string;  // 权限标识

    @Column({ type: 'int', default: 0 })
    sort: number;  // 排序

    @Column({ type: 'int', default: MenuStatus.ACTIVE })
    status: MenuStatus;

    @Column({ default: true })
    visible: boolean;  // 是否显示

    @Column({ default: false })
    keepAlive: boolean;  // 是否缓存

    @Column({ length: 200, nullable: true })
    redirect?: string;  // 重定向地址

    @TreeChildren()
    children: AdminMenu[];

    @TreeParent()
    parent: AdminMenu;

    @Column({ nullable: true })
    parentId?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateMenuDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    path?: string;

    @IsString()
    @IsOptional()
    component?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    type?: MenuType;

    @IsString()
    @IsOptional()
    permission?: string;

    @IsNumber()
    @IsOptional()
    sort?: number;

    @IsNumber()
    @IsOptional()
    status?: MenuStatus;

    @IsBoolean()
    @IsOptional()
    visible?: boolean;

    @IsBoolean()
    @IsOptional()
    keepAlive?: boolean;

    @IsString()
    @IsOptional()
    redirect?: string;

    @IsString()
    @IsOptional()
    parentId?: string;
}

export class UpdateMenuDto extends CreateMenuDto {}

export class QueryMenuDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    status?: MenuStatus;

    @IsOptional()
    type?: MenuType;
}
