import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddContactCSConfig1768600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add contactCSConfig to tasks table
    await queryRunner.addColumn(
      'tasks',
      new TableColumn({
        name: 'contactCSConfig',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Add needContactCS to orders table
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'needContactCS',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    // Add contactCSQuestions to orders table
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'contactCSQuestions',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tasks', 'contactCSConfig');
    await queryRunner.dropColumn('orders', 'needContactCS');
    await queryRunner.dropColumn('orders', 'contactCSQuestions');
  }
}
