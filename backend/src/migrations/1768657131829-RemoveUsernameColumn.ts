import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUsernameColumn1768657131829 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 删除 users 表的 username 列
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 回滚：重新添加 username 列
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "username" VARCHAR(255)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_username" ON "users" ("username")`);
    }

}
