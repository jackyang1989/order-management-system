import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMerchantUsernameColumn1768657483911 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 删除 merchants 表的 username 列
        await queryRunner.query(`ALTER TABLE "merchants" DROP COLUMN "username"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：重新添加 username 列
        await queryRunner.query(`ALTER TABLE "merchants" ADD COLUMN "username" VARCHAR(255)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_merchant_username" ON "merchants" ("username")`);
    }

}
