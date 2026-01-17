import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCanReferFriendsToBuyerAccount1768615090000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加 canReferFriends 字段到 buyer_accounts 表
        await queryRunner.query(`
            ALTER TABLE buyer_accounts
            ADD COLUMN "canReferFriends" boolean NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：删除 canReferFriends 字段
        await queryRunner.query(`
            ALTER TABLE buyer_accounts
            DROP COLUMN "canReferFriends"
        `);
    }

}
