import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEnabledPlatformsFromSystemGlobalConfig1704326600000
  implements MigrationInterface
{
  name = 'RemoveEnabledPlatformsFromSystemGlobalConfig1704326600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('system_global_config');
    if (!tableExists) {
      return;
    }

    const columns = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'system_global_config'
      AND column_name = 'enabledPlatforms'
    `);

    if (columns.length > 0) {
      await queryRunner.query(
        'ALTER TABLE "system_global_config" DROP COLUMN "enabledPlatforms"',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('system_global_config');
    if (!tableExists) {
      return;
    }

    const columns = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'system_global_config'
      AND column_name = 'enabledPlatforms'
    `);

    if (columns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "system_global_config" ADD COLUMN "enabledPlatforms" text NOT NULL DEFAULT '["taobao"]'`,
      );
    }
  }
}
