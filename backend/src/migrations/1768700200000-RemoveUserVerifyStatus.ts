import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserVerifyStatus1768700200000 implements MigrationInterface {
  name = 'RemoveUserVerifyStatus1768700200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 删除用户表中的 verifyStatus 字段
    const hasColumn = await queryRunner.hasColumn('users', 'verifyStatus');
    if (hasColumn) {
      await queryRunner.dropColumn('users', 'verifyStatus');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 恢复 verifyStatus 字段
    await queryRunner.query(`
      ALTER TABLE "users" ADD "verifyStatus" integer NOT NULL DEFAULT 0
    `);
  }
}
