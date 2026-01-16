import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddShortNumberFields1768550400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add userNo to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'userNo',
        type: 'varchar',
        length: '20',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Add merchantNo to merchants table
    await queryRunner.addColumn(
      'merchants',
      new TableColumn({
        name: 'merchantNo',
        type: 'varchar',
        length: '20',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Backfill existing users with short numbers
    const users = await queryRunner.query(
      'SELECT id FROM users ORDER BY "createdAt" ASC',
    );
    for (let i = 0; i < users.length; i++) {
      const userNo = `U${String(10001 + i).padStart(5, '0')}`;
      await queryRunner.query(
        'UPDATE users SET "userNo" = $1 WHERE id = $2',
        [userNo, users[i].id],
      );
    }

    // Backfill existing merchants with short numbers
    const merchants = await queryRunner.query(
      'SELECT id FROM merchants ORDER BY created_at ASC',
    );
    for (let i = 0; i < merchants.length; i++) {
      const merchantNo = `M${String(10001 + i).padStart(5, '0')}`;
      await queryRunner.query(
        'UPDATE merchants SET "merchantNo" = $1 WHERE id = $2',
        [merchantNo, merchants[i].id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'userNo');
    await queryRunner.dropColumn('merchants', 'merchantNo');
  }
}
