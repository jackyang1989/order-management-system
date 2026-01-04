import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

/**
 * 合并提现和银行卡模块迁移
 *
 * 此迁移将：
 * 1. 在 withdrawals 表添加 ownerType 和 ownerId 字段
 * 2. 在 bank_cards 表添加 ownerType、ownerId 和商家特有字段
 * 3. 迁移现有数据
 */
export class MergeWithdrawalsAndBankCards1704326400000 implements MigrationInterface {
  name = 'MergeWithdrawalsAndBankCards1704326400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ 1. 修改 withdrawals 表 ============

    // 添加 ownerType 字段
    await queryRunner.addColumn(
      'withdrawals',
      new TableColumn({
        name: 'ownerType',
        type: 'varchar',
        length: '20',
        default: "'buyer'",
        isNullable: false,
      }),
    );

    // 添加 ownerId 字段
    await queryRunner.addColumn(
      'withdrawals',
      new TableColumn({
        name: 'ownerId',
        type: 'uuid',
        isNullable: true, // 先允许为空，迁移数据后再改为非空
      }),
    );

    // 迁移现有买手提现数据：设置 ownerId = userId
    await queryRunner.query(`
            UPDATE withdrawals
            SET "ownerId" = "userId", "ownerType" = 'buyer'
            WHERE "userId" IS NOT NULL
        `);

    // 从 merchant_withdrawals 迁移数据到 withdrawals
    await queryRunner.query(`
            INSERT INTO withdrawals (
                id, "ownerType", "ownerId", amount, fee, "actualAmount", type, status,
                "bankCardId", "bankName", "accountName", "cardNumber", phone, remark,
                "reviewedAt", "reviewedBy", "createdAt", "updatedAt"
            )
            SELECT
                id, 'merchant', "merchantId", amount, fee, "actualAmount", type, status,
                "bankCardId", "bankName", "accountName", "cardNumber", phone, remark,
                "reviewedAt", "reviewedBy", "createdAt", "updatedAt"
            FROM merchant_withdrawals
        `);

    // 设置 ownerId 为非空
    await queryRunner.changeColumn(
      'withdrawals',
      'ownerId',
      new TableColumn({
        name: 'ownerId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // 添加索引
    await queryRunner.createIndex(
      'withdrawals',
      new TableIndex({
        name: 'IDX_withdrawals_ownerType',
        columnNames: ['ownerType'],
      }),
    );

    await queryRunner.createIndex(
      'withdrawals',
      new TableIndex({
        name: 'IDX_withdrawals_ownerId',
        columnNames: ['ownerId'],
      }),
    );

    // ============ 2. 修改 bank_cards 表 ============

    // 添加 ownerType 字段
    await queryRunner.addColumn(
      'bank_cards',
      new TableColumn({
        name: 'ownerType',
        type: 'varchar',
        length: '20',
        default: "'buyer'",
        isNullable: false,
      }),
    );

    // 添加 ownerId 字段
    await queryRunner.addColumn(
      'bank_cards',
      new TableColumn({
        name: 'ownerId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // 添加 cardType 字段
    await queryRunner.addColumn(
      'bank_cards',
      new TableColumn({
        name: 'cardType',
        type: 'int',
        default: 1,
        isNullable: true,
      }),
    );

    // 添加商家特有字段
    await queryRunner.addColumn(
      'bank_cards',
      new TableColumn({
        name: 'taxNumber',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'bank_cards',
      new TableColumn({
        name: 'licenseImage',
        type: 'text',
        isNullable: true,
      }),
    );

    // 迁移现有买手银行卡数据
    await queryRunner.query(`
            UPDATE bank_cards
            SET "ownerId" = "userId", "ownerType" = 'buyer'
            WHERE "userId" IS NOT NULL
        `);

    // 从 merchant_bank_cards 迁移数据
    await queryRunner.query(`
            INSERT INTO bank_cards (
                id, "ownerType", "ownerId", "bankName", "accountName", "cardNumber",
                "cardType", phone, province, city, "branchName", "idCard",
                "idCardFrontImage", "idCardBackImage", "taxNumber", "licenseImage",
                "isDefault", status, "rejectReason", "createdAt", "updatedAt"
            )
            SELECT
                id, 'merchant', "merchantId", "bankName", "accountName", "cardNumber",
                "cardType", phone, province, city, "branchName", "idCard",
                "idCardFrontImage", "idCardBackImage", "taxNumber", "licenseImage",
                "isDefault", status, "rejectReason", "createdAt", "updatedAt"
            FROM merchant_bank_cards
        `);

    // 设置 ownerId 为非空
    await queryRunner.changeColumn(
      'bank_cards',
      'ownerId',
      new TableColumn({
        name: 'ownerId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // 添加索引
    await queryRunner.createIndex(
      'bank_cards',
      new TableIndex({
        name: 'IDX_bank_cards_ownerType',
        columnNames: ['ownerType'],
      }),
    );

    await queryRunner.createIndex(
      'bank_cards',
      new TableIndex({
        name: 'IDX_bank_cards_ownerId',
        columnNames: ['ownerId'],
      }),
    );

    console.log(
      'Migration completed: Merged withdrawals and bank_cards tables',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============ 回滚 bank_cards 表 ============

    // 删除索引
    await queryRunner.dropIndex('bank_cards', 'IDX_bank_cards_ownerType');
    await queryRunner.dropIndex('bank_cards', 'IDX_bank_cards_ownerId');

    // 删除商家特有字段
    await queryRunner.dropColumn('bank_cards', 'licenseImage');
    await queryRunner.dropColumn('bank_cards', 'taxNumber');
    await queryRunner.dropColumn('bank_cards', 'cardType');
    await queryRunner.dropColumn('bank_cards', 'ownerId');
    await queryRunner.dropColumn('bank_cards', 'ownerType');

    // ============ 回滚 withdrawals 表 ============

    // 删除索引
    await queryRunner.dropIndex('withdrawals', 'IDX_withdrawals_ownerType');
    await queryRunner.dropIndex('withdrawals', 'IDX_withdrawals_ownerId');

    // 删除新字段
    await queryRunner.dropColumn('withdrawals', 'ownerId');
    await queryRunner.dropColumn('withdrawals', 'ownerType');

    console.log(
      'Rollback completed: Separated withdrawals and bank_cards tables',
    );
  }
}
