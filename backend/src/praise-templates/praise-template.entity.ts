import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PraiseTemplateType {
    TEXT = 1,    // 文字好评
    IMAGE = 2,   // 图片好评
    VIDEO = 3,   // 视频好评
}

@Entity('praise_templates')
export class PraiseTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    merchantId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'merchantId' })
    merchant: User;

    @Column({ type: 'enum', enum: PraiseTemplateType })
    type: PraiseTemplateType;

    @Column({ nullable: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    content: string;

    @Column({ type: 'text', nullable: true })
    images: string; // JSON array of image URLs

    @Column({ nullable: true })
    videoUrl: string;

    @Column({ nullable: true })
    videoCover: string;

    @Column({ type: 'int', default: 0 })
    usageCount: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
