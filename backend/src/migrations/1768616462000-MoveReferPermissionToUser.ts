import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveReferPermissionToUser1768616462000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. 在 users 表添加 canReferFriends 列
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS "canReferFriends" boolean NOT NULL DEFAULT true
        `);

        // 2. 从 buyer_accounts 表删除 canReferFriends 列
        await queryRunner.query(`
            ALTER TABLE buyer_accounts
            DROP COLUMN IF EXISTS "canReferFriends"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：恢复 buyer_accounts 的列，删除 users 的列
        await queryRunner.query(`
            ALTER TABLE buyer_accounts
            ADD COLUMN IF NOT EXISTS "canReferFriends" boolean NOT NULL DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN IF EXISTS "canReferFriends"
        `);
    }

}
