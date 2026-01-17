import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 删除VIP功能相关的字段和表
 *
 * 修改内容：
 * 1. 删除 users 表的 vip 和 vipExpireAt 字段
 * 2. 删除 merchants 表的 vip 和 vip_expire_at 字段
 * 3. 删除 vip_packages 表
 * 4. 删除 vip_purchases 表
 * 5. 删除 recharge_orders 表
 * 6. 删除 vip_levels 表
 */
export class RemoveVipFeature1737115200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 删除 users 表的 VIP 字段
    const usersTable = await queryRunner.getTable('users');
    if (usersTable) {
      const vipColumn = usersTable.findColumnByName('vip');
      if (vipColumn) {
        await queryRunner.dropColumn('users', 'vip');
      }

      const vipExpireAtColumn = usersTable.findColumnByName('vipExpireAt');
      if (vipExpireAtColumn) {
        await queryRunner.dropColumn('users', 'vipExpireAt');
      }
    }

    // 2. 删除 merchants 表的 VIP 字段
    const merchantsTable = await queryRunner.getTable('merchants');
    if (merchantsTable) {
      const vipColumn = merchantsTable.findColumnByName('vip');
      if (vipColumn) {
        await queryRunner.dropColumn('merchants', 'vip');
      }

      const vipExpireAtColumn = merchantsTable.findColumnByName('vip_expire_at');
      if (vipExpireAtColumn) {
        await queryRunner.dropColumn('merchants', 'vip_expire_at');
      }
    }

    // 3. 删除 VIP 相关的表
    const tables = [
      'vip_purchases',
      'vip_packages',
      'recharge_orders',
      'vip_levels',
    ];

    for (const tableName of tables) {
      const table = await queryRunner.getTable(tableName);
      if (table) {
        await queryRunner.dropTable(tableName);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：恢复 VIP 字段
    // 注意：这只是恢复表结构，不会恢复数据

    // 1. 恢复 users 表的 VIP 字段
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN vip BOOLEAN DEFAULT false,
      ADD COLUMN "vipExpireAt" TIMESTAMP
    `);

    // 2. 恢复 merchants 表的 VIP 字段
    await queryRunner.query(`
      ALTER TABLE merchants
      ADD COLUMN vip BOOLEAN DEFAULT false,
      ADD COLUMN vip_expire_at TIMESTAMP
    `);

    // 3. 恢复 VIP 相关的表（仅表结构，不含数据）
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vip_levels (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) NOT NULL,
        level INT NOT NULL,
        "minScore" INT NOT NULL,
        "maxScore" INT NOT NULL,
        "commissionBonus" DECIMAL(5,2) DEFAULT 0,
        "dailyTaskLimit" INT DEFAULT 0,
        privileges TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vip_packages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        days INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "originalPrice" DECIMAL(10,2),
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "sortOrder" INT DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vip_purchases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL,
        "packageId" UUID NOT NULL,
        "orderNo" VARCHAR(50) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        days INT NOT NULL,
        status INT DEFAULT 0,
        "paymentMethod" VARCHAR(50),
        "vipStartAt" TIMESTAMP,
        "vipEndAt" TIMESTAMP,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recharge_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" UUID NOT NULL,
        "orderNo" VARCHAR(50) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status INT DEFAULT 0,
        "paymentMethod" VARCHAR(50),
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
