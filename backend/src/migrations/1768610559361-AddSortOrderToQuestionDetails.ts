import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSortOrderToQuestionDetails1768610559361 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add sortOrder column
        await queryRunner.query(`
            ALTER TABLE "question_details"
            ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0
        `);

        // Set initial sortOrder based on createdAt
        await queryRunner.query(`
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY "questionSchemeId" ORDER BY "createdAt") - 1 as rn
                FROM question_details
            )
            UPDATE question_details
            SET "sortOrder" = ranked.rn
            FROM ranked
            WHERE question_details.id = ranked.id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "question_details"
            DROP COLUMN IF EXISTS "sortOrder"
        `);
    }

}
