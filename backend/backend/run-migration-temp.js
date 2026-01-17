const { DataSource } = require('typeorm');

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'jianouyang',
    password: '',
    database: 'order_management',
});

async function runMigration() {
    try {
        await dataSource.initialize();
        console.log('数据库连接成功');

        // 1. 在 users 表添加 canReferFriends 列
        await dataSource.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS "canReferFriends" boolean NOT NULL DEFAULT true
        `);
        console.log('✓ 已在 users 表添加 canReferFriends 列');

        // 2. 从 buyer_accounts 表删除 canReferFriends 列
        await dataSource.query(`
            ALTER TABLE buyer_accounts
            DROP COLUMN IF EXISTS "canReferFriends"
        `);
        console.log('✓ 已从 buyer_accounts 表删除 canReferFriends 列');

        console.log('迁移完成！');
    } catch (error) {
        console.error('迁移失败:', error);
    } finally {
        await dataSource.destroy();
    }
}

runMigration();
