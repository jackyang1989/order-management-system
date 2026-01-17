import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('visitors')
export class Visitor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    visitorId: string; // 前端生成的唯一ID/Fingerprint

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    avator: string;

    @Column({ nullable: true })
    ip: string;

    @Column({ nullable: true })
    region: string; // 地理位置

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    os: string; // 操作系统

    @Column({ nullable: true })
    browser: string; // 浏览器

    @Column({ type: 'int', default: 1 })
    visitCount: number; // 来访次数

    @Column({ type: 'text', nullable: true })
    currentUrl: string; // 当前所在URL

    @Column({ type: 'text', nullable: true })
    referer: string; // 来源页面

    @Column({ type: 'int', default: 1 })
    status: number; // 1: 在线, 0: 离线

    @Column({ type: 'timestamp', nullable: true })
    lastActivityAt: Date; // 最后活动时间

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
