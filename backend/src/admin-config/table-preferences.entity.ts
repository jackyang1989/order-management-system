import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface ColumnConfig {
    key: string;
    visible: boolean;
    width: number;
    order: number;
}

@Entity('table_preferences')
@Index(['adminId', 'tableKey'], { unique: true })
export class TablePreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: '管理员ID' })
    adminId: string;

    @Column({ length: 50, comment: '表格标识 (如 admin_users, admin_merchants)' })
    tableKey: string;

    @Column('jsonb', { comment: '列配置' })
    columns: ColumnConfig[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
