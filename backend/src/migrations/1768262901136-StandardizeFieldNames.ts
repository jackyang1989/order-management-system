import { MigrationInterface, QueryRunner } from 'typeorm';

export class StandardizeFieldNames1768262901136 implements MigrationInterface {
    name = 'StandardizeFieldNames1768262901136';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ============ Task Entity ============

        // taoWord -> itemToken
        await this.renameColumn(queryRunner, 'tasks', 'taoWord', 'itemToken');

        // ztcKeyword -> adKeyword
        await this.renameColumn(queryRunner, 'tasks', 'ztcKeyword', 'adKeyword');

        // is_free_shiping -> isFreeShipping (Note: TypeORM default naming strategy might be is_free_shipping)
        // First checking the actual column name in DB
        const isFreeShipingExists = await this.columnExists(queryRunner, 'tasks', 'is_free_shiping');
        if (isFreeShipingExists) {
            await queryRunner.renameColumn('tasks', 'is_free_shiping', 'isFreeShipping');
            console.log('Renamed tasks.is_free_shiping -> isFreeShipping');
        }

        // yfPrice -> presaleDeposit
        await this.renameColumn(queryRunner, 'tasks', 'yfPrice', 'presaleDeposit');

        // wkPrice -> finalPayment
        await this.renameColumn(queryRunner, 'tasks', 'wkPrice', 'finalPayment');


        // ============ Order Entity ============

        // yfPrice -> presaleDeposit
        await this.renameColumn(queryRunner, 'orders', 'yfPrice', 'presaleDeposit');

        // wkPrice -> finalPayment
        await this.renameColumn(queryRunner, 'orders', 'wkPrice', 'finalPayment');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ============ Order Entity ============

        // finalPayment -> wkPrice
        await this.renameColumn(queryRunner, 'orders', 'finalPayment', 'wkPrice');

        // presaleDeposit -> yfPrice
        await this.renameColumn(queryRunner, 'orders', 'presaleDeposit', 'yfPrice');


        // ============ Task Entity ============

        // finalPayment -> wkPrice
        await this.renameColumn(queryRunner, 'tasks', 'finalPayment', 'wkPrice');

        // presaleDeposit -> yfPrice
        await this.renameColumn(queryRunner, 'tasks', 'presaleDeposit', 'yfPrice');

        // isFreeShipping -> is_free_shiping
        // Note: This matches the previous incorrect name for rollback
        const isFreeShippingExists = await this.columnExists(queryRunner, 'tasks', 'isFreeShipping');
        if (isFreeShippingExists) {
            await queryRunner.renameColumn('tasks', 'isFreeShipping', 'is_free_shiping');
        }

        // adKeyword -> ztcKeyword
        await this.renameColumn(queryRunner, 'tasks', 'adKeyword', 'ztcKeyword');

        // itemToken -> taoWord
        await this.renameColumn(queryRunner, 'tasks', 'itemToken', 'taoWord');
    }

    private async renameColumn(queryRunner: QueryRunner, tableName: string, oldName: string, newName: string) {
        const hasColumn = await this.columnExists(queryRunner, tableName, oldName);
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "${tableName}" RENAME COLUMN "${oldName}" TO "${newName}"`);
            console.log(`Renamed ${tableName}.${oldName} -> ${newName}`);
        } else {
            console.log(`Skipped ${tableName}.${oldName} -> ${newName} (Column not found)`);
        }
    }

    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const result = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' AND column_name = '${columnName}'
    `);
        return result.length > 0;
    }
}
