import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

@Entity('banks')
export class Bank {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    name: string;  // 银行名称

    @Column({ type: 'text', nullable: true })
    icon?: string;  // 银行图标

    @Column({ length: 20, nullable: true })
    code?: string;  // 银行代码

    @Column({ type: 'int', default: 0 })
    sort: number;  // 排序

    @Column({ default: true })
    isActive: boolean;  // 是否启用

    @CreateDateColumn()
    createdAt: Date;
}

// DTOs
export class CreateBankDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsNumber()
    @IsOptional()
    sort?: number;
}
