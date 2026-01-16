import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddQuestionTemplates1768700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建问题模板方案表
    await queryRunner.createTable(
      new Table({
        name: 'question_schemes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sellerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'shopId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 创建问题模板详情表
    await queryRunner.createTable(
      new Table({
        name: 'question_details',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'questionSchemeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'questions',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // 添加索引
    await queryRunner.query(
      `CREATE INDEX "IDX_question_schemes_sellerId" ON "question_schemes" ("sellerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_schemes_shopId" ON "question_schemes" ("shopId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_details_questionSchemeId" ON "question_details" ("questionSchemeId")`,
    );

    // 添加外键约束
    await queryRunner.createForeignKey(
      'question_schemes',
      new TableForeignKey({
        columnNames: ['sellerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'merchants',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'question_schemes',
      new TableForeignKey({
        columnNames: ['shopId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shops',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'question_details',
      new TableForeignKey({
        columnNames: ['questionSchemeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'question_schemes',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('question_details');
    await queryRunner.dropTable('question_schemes');
  }
}
