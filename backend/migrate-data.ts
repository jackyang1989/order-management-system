/**
 * 数据迁移脚本 - 将旧版 MySQL 数据导入新系统 PostgreSQL
 *
 * 运行方式: npx ts-node migrate-data.ts
 */

import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';

// 旧版用户数据 (从 SQL 文件提取)
const oldUsers = [
    { id: 1633, username: 'ouyang', mobile: '15622252279', login_pwd: 'cb227b5799bc62993647300473bd5336', balance: 476, reward: 32, vip: 1, invite_code: '7b79edb6bfe1fdab7f1a64e652c85f29', tjuser: 'infu', qq: '7828151' },
    { id: 1638, username: 'jackyang', mobile: '15677718525', login_pwd: 'cb227b5799bc62993647300473bd5336', balance: 109, reward: 7.5, vip: 1, invite_code: '96802e7fbe8660102101aae43c4e2afc', tjuser: 'ouyang', qq: '2652095556' },
    { id: 1639, username: '13326640410', mobile: '13326640410', login_pwd: '60f774f7dceff1531d5cc16cf5123200', balance: 0, reward: 1, vip: 1, invite_code: 'cbca573cb114b6076d8def59fd5c4c37', tjuser: 'ouyang', qq: '109128216' },
    { id: 1640, username: '13828611980', mobile: '13828611980', login_pwd: '33ce17a399acae8041348ff8b298371a', balance: 1.2, reward: 0, vip: 1, invite_code: '5a7d24c69a2649afbdeedc3d6b95bbeb', tjuser: '13326640410', qq: '815147785' },
    { id: 1641, username: '13831545855', mobile: '13831545855', login_pwd: '3b29b5b6b6e33a2c9954ddceaf1ad5a5', balance: 0, reward: 0, vip: 0, invite_code: '7a75abdc7c6efe2ef76ddab233f7ce70', tjuser: '白雪', qq: '2861393516' },
    { id: 1642, username: 'tb664842567', mobile: '18364858938', login_pwd: '0467ff464c1e52d32fa2e1ce4926fa18', balance: 0, reward: 8, vip: 1, invite_code: '682131d78fbfa0e3ebcbfcbac844ee60', tjuser: 'ouyang', qq: '1844972679' },
    { id: 1643, username: '爱你', mobile: '13870424966', login_pwd: 'e10adc3949ba59abbe56e057f20f883e', balance: 0, reward: 2, vip: 1, invite_code: '35722b1d6a94e0110aea88f30d7580fa', tjuser: 'ouyang', qq: '280390677' },
    { id: 1644, username: '和煦冬日9662', mobile: '17630034099', login_pwd: '5eca08cda7c03b799660bccf8756e9d6', balance: 0, reward: 0, vip: 1, invite_code: '6f10ded66481b9cd554247ab97701731', tjuser: '白雪', qq: '294209279' },
    { id: 1645, username: '白雪', mobile: '15194997929', login_pwd: '29ecaa06eba6972328e2714d8aa18ece', balance: 0, reward: 12, vip: 1, invite_code: 'c726a3091f19b9d04b63588e110cbd59', tjuser: 'ouyang', qq: '925603037' },
];

// 管理员数据
const adminUser = {
    username: 'admin',
    name: '欧阳',
    password: 'fe229dee6f2e1c67ed53a2a8b8bd4e97', // MD5 of original password
    roleId: 1
};

async function migrate() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'order_management',
        user: process.env.DB_USERNAME || '',
        password: process.env.DB_PASSWORD || '',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        // 1. 清空现有测试用户 (可选)
        // await client.query('DELETE FROM users WHERE username = $1', ['testuser']);

        // 2. 导入用户数据
        // 由于旧系统使用 MD5，新系统使用 bcrypt，我们需要设置一个临时密码
        // 用户首次登录后需要重置密码
        const tempPassword = await bcrypt.hash('123456', 10); // 临时密码: 123456

        for (const user of oldUsers) {
            // 检查用户是否已存在
            const existing = await client.query(
                'SELECT id FROM users WHERE phone = $1 OR username = $2',
                [user.mobile.toString(), user.username]
            );

            if (existing.rows.length > 0) {
                console.log(`User ${user.username} already exists, skipping...`);
                continue;
            }

            // 生成唯一邀请码 (使用旧系统的或生成新的)
            const inviteCode = user.invite_code.substring(0, 8).toUpperCase();

            try {
                await client.query(`
                    INSERT INTO users (
                        username, password, phone, qq, vip, balance, reward, silver,
                        "invitationCode", "invitedBy", "createdAt", "updatedAt",
                        "frozenBalance", "frozenSilver", "referrerType", "referralReward",
                        "referralRewardToday", "referralCount", "verifyStatus", "isActive", "isBanned"
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, 0,
                        $8, $9, NOW(), NOW(),
                        0, 0, 0, 0, 0, 0, 0, true, false
                    )
                `, [
                    user.username,
                    tempPassword, // 使用 bcrypt 加密的临时密码
                    user.mobile.toString(),
                    user.qq,
                    user.vip === 1,
                    user.balance,
                    user.reward,
                    inviteCode,
                    user.tjuser || null
                ]);
                console.log(`Imported user: ${user.username}`);
            } catch (err: any) {
                console.error(`Failed to import user ${user.username}:`, err.message);
            }
        }

        // 3. 导入/更新管理员
        const adminExists = await client.query(
            'SELECT id FROM admin_users WHERE username = $1',
            [adminUser.username]
        );

        const adminPassword = await bcrypt.hash('admin123', 10); // 管理员密码: admin123

        if (adminExists.rows.length === 0) {
            await client.query(`
                INSERT INTO admin_users (username, password, "realName", "roleId", "isActive", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, true, NOW(), NOW())
            `, [adminUser.username, adminPassword, adminUser.name, adminUser.roleId]);
            console.log('Created admin user: admin');
        } else {
            // 更新管理员密码
            await client.query(
                'UPDATE admin_users SET password = $1 WHERE username = $2',
                [adminPassword, adminUser.username]
            );
            console.log('Updated admin user password');
        }

        console.log('\n=== 迁移完成 ===');
        console.log('用户临时密码: 123456');
        console.log('管理员账号: admin');
        console.log('管理员密码: admin123');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await client.end();
    }
}

migrate();
