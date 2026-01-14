import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 为 task_keywords 表添加高级设置字段
 * - compareKeyword: 货比关键词 (从 advancedSettings.compareKeyword)
 * - backupKeyword: 备用关键词/副关键词 (从 advancedSettings.backupKeyword)
 */
export class AddAdvancedKeywordFields1768383000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查表是否存在
    const tableExists = await queryRunner.hasTable('task_keywords');
    if (!tableExists) {
      console.log('Table task_keywords does not exist, skipping migration');
      return;
    }

    // 检查列是否已存在
    const compareKeywordExists = await queryRunner.hasColumn('task_keywords', 'compareKeyword');
    const backupKeywordExists = await queryRunner.hasColumn('task_keywords', 'backupKeyword');

    // 添加 compareKeyword 字段
    if (!compareKeywordExists) {
      await queryRunner.query(
        `ALTER TABLE "task_keywords" ADD COLUMN "compareKeyword" VARCHAR(100)`
      );
      console.log('Added compareKeyword column to task_keywords');
    } else {
      console.log('Column compareKeyword already exists in task_keywords');
    }

    // 添加 backupKeyword 字段
    if (!backupKeywordExists) {
      await queryRunner.query(
        `ALTER TABLE "task_keywords" ADD COLUMN "backupKeyword" VARCHAR(100)`
      );
      console.log('Added backupKeyword column to task_keywords');
    } else {
      console.log('Column backupKeyword already exists in task_keywords');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 检查表是否存在
    const tableExists = await queryRunner.hasTable('task_keywords');
    if (!tableExists) {
      console.log('Table task_keywords does not exist, skipping rollback');
      return;
    }

    // 检查并删除 backupKeyword 字段
    const backupKeywordExists = await queryRunner.hasColumn('task_keywords', 'backupKeyword');
    if (backupKeywordExists) {
      await queryRunner.query(
        `ALTER TABLE "task_keywords" DROP COLUMN "backupKeyword"`
      );
      console.log('Removed backupKeyword column from task_keywords');
    }

    // 检查并删除 compareKeyword 字段
    const compareKeywordExists = await queryRunner.hasColumn('task_keywords', 'compareKeyword');
    if (compareKeywordExists) {
      await queryRunner.query(
        `ALTER TABLE "task_keywords" DROP COLUMN "compareKeyword"`
      );
      console.log('Removed compareKeyword column from task_keywords');
    }
  }
}
