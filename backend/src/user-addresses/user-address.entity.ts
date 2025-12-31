import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

@Entity('user_addresses')
export class UserAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;  // 所属用户

    @Column({ length: 50 })
    name: string;  // 收货人姓名

    @Column({ length: 20 })
    phone: string;  // 收货人手机

    @Column({ length: 50, nullable: true })
    province?: string;  // 省份

    @Column({ length: 50, nullable: true })
    city?: string;  // 城市

    @Column({ length: 50, nullable: true })
    district?: string;  // 区县

    @Column({ type: 'text' })
    address: string;  // 详细地址

    @Column({ length: 20, nullable: true })
    postalCode?: string;  // 邮政编码

    @Column({ default: false })
    isDefault: boolean;  // 是否默认地址

    @Column({ type: 'text', nullable: true })
    tag?: string;  // 标签（如：家、公司）

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateUserAddressDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    province?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsString()
    @IsOptional()
    tag?: string;

    @IsOptional()
    isDefault?: boolean;
}

export class UpdateUserAddressDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    province?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsString()
    @IsOptional()
    tag?: string;
}
