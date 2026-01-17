import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveVipConfigs1768664195023 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 删除VIP相关的配置项
        await queryRunner.query(`
            DELETE FROM system_configs
            WHERE key IN (
                'user_register_vip_days',
                'seller_register_vip_days',
                'first_account_vip_days'
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 恢复VIP配置项(如果需要回滚)
        await queryRunner.query(`
            INSERT INTO system_configs
            ("key", "value", "group", "label", "valueType", "isEditable", "isVisible", "sortOrder")
            VALUES
            ('user_register_vip_days', '0', 'register', '买手注册赠送VIP天数', 'number', true, true, 0),
            ('seller_register_vip_days', '0', 'register', '商家注册赠送VIP天数', 'number', true, true, 0),
            ('first_account_vip_days', '7', 'system', '首个买号审核通过赠送VIP天数', 'number', true, true, 10)
            ON CONFLICT ("key") DO NOTHING
        `);
    }

}
