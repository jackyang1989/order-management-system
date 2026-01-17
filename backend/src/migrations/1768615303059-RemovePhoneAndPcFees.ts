import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePhoneAndPcFees1768615303059 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 删除 phone_fee 和 pc_fee 配置项
        await queryRunner.query(`
            DELETE FROM system_configs
            WHERE key IN ('phone_fee', 'pc_fee')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 如果需要回滚，重新插入这些配置项
        await queryRunner.query(`
            INSERT INTO system_configs (key, value, "group", label, "valueType", "isEditable", "isVisible")
            VALUES
                ('phone_fee', '0.3', 'task_fee', '手机端加成服务费', 'number', true, true),
                ('pc_fee', '0.2', 'task_fee', 'PC端加成服务费', 'number', true, true)
            ON CONFLICT (key) DO NOTHING
        `);
    }

}
