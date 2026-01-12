import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 重命名浏览行为字段
 *
 * 此迁移将英文+拼音混合的字段名改为纯英文：
 * - needHuobi -> needCompare (货比)
 * - huobiKeyword -> compareKeyword (货比关键词)
 * - needShoucang -> needFavorite (收藏商品)
 * - needGuanzhu -> needFollow (关注店铺)
 * - needJialiao -> needContactCS (联系客服)
 * - needJiagou -> needAddCart (加入购物车)
 */
export class RenameBrowseBehaviorFields1704326500000
  implements MigrationInterface
{
  name = 'RenameBrowseBehaviorFields1704326500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查 tasks 表是否存在
    const tableExists = await queryRunner.hasTable('tasks');
    if (!tableExists) {
      console.log('Table "tasks" does not exist, skipping migration');
      return;
    }

    // 检查旧字段是否存在，如果存在则重命名
    const columns = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      AND column_name IN ('needHuobi', 'huobiKeyword', 'needShoucang', 'needGuanzhu', 'needJialiao', 'needJiagou')
    `);

    const existingColumns = columns.map((c: { column_name: string }) => c.column_name);

    // needHuobi -> needCompare
    if (existingColumns.includes('needHuobi')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needHuobi" TO "needCompare"`,
      );
      console.log('Renamed needHuobi -> needCompare');
    }

    // huobiKeyword -> compareKeyword
    if (existingColumns.includes('huobiKeyword')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "huobiKeyword" TO "compareKeyword"`,
      );
      console.log('Renamed huobiKeyword -> compareKeyword');
    }

    // needShoucang -> needFavorite
    if (existingColumns.includes('needShoucang')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needShoucang" TO "needFavorite"`,
      );
      console.log('Renamed needShoucang -> needFavorite');
    }

    // needGuanzhu -> needFollow
    if (existingColumns.includes('needGuanzhu')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needGuanzhu" TO "needFollow"`,
      );
      console.log('Renamed needGuanzhu -> needFollow');
    }

    // needJialiao -> needContactCS
    if (existingColumns.includes('needJialiao')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needJialiao" TO "needContactCS"`,
      );
      console.log('Renamed needJialiao -> needContactCS');
    }

    // needJiagou -> needAddCart
    if (existingColumns.includes('needJiagou')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needJiagou" TO "needAddCart"`,
      );
      console.log('Renamed needJiagou -> needAddCart');
    }

    console.log(
      'Migration completed: Renamed browse behavior fields to English',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 检查 tasks 表是否存在
    const tableExists = await queryRunner.hasTable('tasks');
    if (!tableExists) {
      console.log('Table "tasks" does not exist, skipping rollback');
      return;
    }

    // 检查新字段是否存在，如果存在则重命名回去
    const columns = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      AND column_name IN ('needCompare', 'compareKeyword', 'needFavorite', 'needFollow', 'needContactCS', 'needAddCart')
    `);

    const existingColumns = columns.map((c: { column_name: string }) => c.column_name);

    // needCompare -> needHuobi
    if (existingColumns.includes('needCompare')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needCompare" TO "needHuobi"`,
      );
    }

    // compareKeyword -> huobiKeyword
    if (existingColumns.includes('compareKeyword')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "compareKeyword" TO "huobiKeyword"`,
      );
    }

    // needFavorite -> needShoucang
    if (existingColumns.includes('needFavorite')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needFavorite" TO "needShoucang"`,
      );
    }

    // needFollow -> needGuanzhu
    if (existingColumns.includes('needFollow')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needFollow" TO "needGuanzhu"`,
      );
    }

    // needContactCS -> needJialiao
    if (existingColumns.includes('needContactCS')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needContactCS" TO "needJialiao"`,
      );
    }

    // needAddCart -> needJiagou
    if (existingColumns.includes('needAddCart')) {
      await queryRunner.query(
        `ALTER TABLE "tasks" RENAME COLUMN "needAddCart" TO "needJiagou"`,
      );
    }

    console.log(
      'Rollback completed: Restored browse behavior fields to Pinyin',
    );
  }
}
