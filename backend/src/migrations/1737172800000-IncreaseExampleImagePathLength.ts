import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseExampleImagePathLength1737172800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 将 exampleImagePath 字段从 VARCHAR(500) 改为 TEXT，支持更大的 base64 图片
        await queryRunner.query(`
            ALTER TABLE platform_image_requirements
            ALTER COLUMN "exampleImagePath" TYPE TEXT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE platform_image_requirements
            ALTER COLUMN "exampleImagePath" TYPE VARCHAR(500)
        `);
    }

}
