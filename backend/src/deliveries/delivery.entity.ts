import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string; // 快递公司名称

  @Column({ length: 20, nullable: true })
  code?: string; // 快递代码（用于物流查询API）

  @Column({ type: 'text', nullable: true })
  logo?: string; // 快递公司logo

  @Column({ length: 20, nullable: true })
  phone?: string; // 客服电话

  @Column({ type: 'int', default: 0 })
  sort: number; // 排序

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class CreateDeliveryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  sort?: number;
}
