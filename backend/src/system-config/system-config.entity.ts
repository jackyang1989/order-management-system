import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
    @PrimaryColumn()
    key: string;

    @Column()
    value: string;

    @Column({ nullable: true })
    group: string;

    @Column({ nullable: true })
    description: string;
}
