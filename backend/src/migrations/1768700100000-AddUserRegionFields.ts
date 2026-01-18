import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRegionFields1768700100000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加用户所在地区字段
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS "province" VARCHAR(100),
            ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
            ADD COLUMN IF NOT EXISTS "district" VARCHAR(100)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：删除地区字段
        await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN IF EXISTS "province",
            DROP COLUMN IF EXISTS "city",
            DROP COLUMN IF EXISTS "district"
        `);
    }

}
