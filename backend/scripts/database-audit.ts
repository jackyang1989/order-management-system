/**
 * Database Audit & Cleanup Script
 * 
 * Purpose: Identify orphan tables, legacy fields, and inconsistent data
 * 
 * Run with: npx ts-node scripts/database-audit.ts
 */

import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

// Database configuration
const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'jianouyang',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'order_management',
});

// Expected tables from NestJS entities (CamelCase naming)
const EXPECTED_TABLES = [
    'admin_menus',
    'admin_users',
    'bank_cards',
    'banks',
    'buyer_accounts',
    'categories',
    'categories_closure',
    'commission_rates',
    'config', // system config
    'day_counts', // user day counts
    'deliveries',
    'delivery_warehouses',
    'finance_records',
    'fund_records',
    'goods',
    'keywords',
    'keyword_details',
    'merchant_bank_cards',
    'merchant_blacklist',
    'merchant_withdrawals',
    'merchants',
    'messages',
    'notices',
    'operation_logs',
    'order_logs',
    'orders',
    'payments',
    'payment_orders',
    'platforms',
    'praise_templates',
    'recharges',
    'reward_recharges',
    'referral_rewards',
    'review_tasks',
    'review_task_praises',
    'review_task_details',
    'sensitive_words',
    'shops',
    'sms_codes',
    'sms_logs',
    'system_config',
    'system_configs',
    'system_global_config',
    'task_drafts',
    'task_goods',
    'task_keywords',
    'tasks',
    'uploaded_files',
    'uploads',
    'user_addresses',
    'user_credits',
    'user_day_counts',
    'user_invites',
    'users',
    'vip_levels',
    'vip_level_configs',
    'vip_packages',
    'vip_purchases',
    'vip_records',
    'withdrawals',
];

// Additional system tables (TypeORM migrations, etc.)
const SYSTEM_TABLES = [
    'migrations',
    'typeorm_metadata',
];

// Tables that may be unused but should be reviewed
const REVIEW_TABLES: string[] = [];

interface AuditResult {
    orphanTables: string[];
    legacyColumns: { table: string; column: string }[];
    zombieUsers: { table: string; count: number }[];
    zombieMerchants: { table: string; count: number }[];
    sequenceInfo: { table: string; maxId: number; currentSeq: number }[];
}

async function auditDatabase(): Promise<AuditResult> {
    await dataSource.initialize();
    console.log('✓ Database connected\n');

    const result: AuditResult = {
        orphanTables: [],
        legacyColumns: [],
        zombieUsers: [],
        zombieMerchants: [],
        sequenceInfo: [],
    };

    // 1. Find orphan tables (tables not in expected list)
    console.log('=== 1. ORPHAN TABLE AUDIT ===\n');
    const tablesQuery = await dataSource.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

    const allExpected = [...EXPECTED_TABLES, ...SYSTEM_TABLES];
    for (const row of tablesQuery) {
        const tableName = row.table_name;
        if (!allExpected.includes(tableName)) {
            result.orphanTables.push(tableName);
        }
    }

    if (result.orphanTables.length > 0) {
        console.log('⚠️  Orphan tables found (not defined in entities):');
        for (const table of result.orphanTables) {
            const countResult = await dataSource.query(`SELECT COUNT(*) as count FROM "${table}"`);
            console.log(`   - ${table} (${countResult[0].count} rows)`);
        }
    } else {
        console.log('✓ No orphan tables found');
    }

    // 2. Check for legacy column naming (snake_case Chinese pinyin)
    console.log('\n=== 2. LEGACY COLUMN AUDIT ===\n');
    const legacyPrefixes = ['tfkz_', 'shang_', 'mai_', 'dian_', 'gou_'];

    const columnsQuery = await dataSource.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name
  `);

    for (const row of columnsQuery) {
        for (const prefix of legacyPrefixes) {
            if (row.column_name.startsWith(prefix)) {
                result.legacyColumns.push({ table: row.table_name, column: row.column_name });
            }
        }
    }

    if (result.legacyColumns.length > 0) {
        console.log('⚠️  Legacy columns found:');
        for (const col of result.legacyColumns) {
            console.log(`   - ${col.table}.${col.column}`);
        }
    } else {
        console.log('✓ No legacy column prefixes found');
    }

    // 3. Find zombie records (orphan foreign keys)
    console.log('\n=== 3. ZOMBIE RECORD AUDIT ===\n');

    // Tables with userId that should reference users table
    const userFkTables = [
        'orders', 'buyer_accounts', 'bank_cards', 'withdrawals',
        'user_addresses', 'user_credits', 'user_day_counts',
        'fund_records', 'user_invites', 'vip_purchases', 'vip_records'
    ];

    for (const table of userFkTables) {
        try {
            const zombieQuery = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM "${table}" t 
        LEFT JOIN users u ON t."userId" = u.id::text
        WHERE u.id IS NULL AND t."userId" IS NOT NULL
      `);
            if (parseInt(zombieQuery[0].count) > 0) {
                result.zombieUsers.push({ table, count: parseInt(zombieQuery[0].count) });
                console.log(`⚠️  ${table}: ${zombieQuery[0].count} records with missing user`);
            }
        } catch (e) {
            // Table or column might not exist, skip
        }
    }

    // Tables with merchantId that should reference merchants table
    const merchantFkTables = [
        'tasks', 'shops', 'goods', 'merchant_bank_cards',
        'merchant_withdrawals', 'recharges'
    ];

    for (const table of merchantFkTables) {
        try {
            const zombieQuery = await dataSource.query(`
        SELECT COUNT(*) as count 
        FROM "${table}" t 
        LEFT JOIN merchants m ON t."merchantId" = m.id::text
        WHERE m.id IS NULL AND t."merchantId" IS NOT NULL
      `);
            if (parseInt(zombieQuery[0].count) > 0) {
                result.zombieMerchants.push({ table, count: parseInt(zombieQuery[0].count) });
                console.log(`⚠️  ${table}: ${zombieQuery[0].count} records with missing merchant`);
            }
        } catch (e) {
            // Table or column might not exist, skip
        }
    }

    if (result.zombieUsers.length === 0 && result.zombieMerchants.length === 0) {
        console.log('✓ No zombie records found');
    }

    // 4. Sequence info for ID reset
    console.log('\n=== 4. SEQUENCE AUDIT ===\n');

    const seqQuery = await dataSource.query(`
    SELECT 
      schemaname, 
      sequencename,
      last_value
    FROM pg_sequences 
    WHERE schemaname = 'public'
    ORDER BY sequencename
  `);

    console.log('Sequences:');
    for (const seq of seqQuery) {
        console.log(`   - ${seq.sequencename}: last_value = ${seq.last_value}`);
    }

    await dataSource.destroy();
    return result;
}

async function generateCleanupScript(result: AuditResult): Promise<string> {
    const lines: string[] = [
        '-- Database Cleanup Script',
        '-- Generated: ' + new Date().toISOString(),
        '-- REVIEW CAREFULLY BEFORE EXECUTING',
        '',
        'BEGIN;',
        '',
    ];

    // Drop orphan tables
    if (result.orphanTables.length > 0) {
        lines.push('-- 1. DROP ORPHAN TABLES');
        for (const table of result.orphanTables) {
            lines.push(`-- DROP TABLE IF EXISTS "${table}" CASCADE;`);
        }
        lines.push('');
    }

    // Delete zombie records
    if (result.zombieUsers.length > 0) {
        lines.push('-- 2. DELETE ZOMBIE USER RECORDS');
        for (const z of result.zombieUsers) {
            lines.push(`-- DELETE FROM "${z.table}" WHERE "userId" NOT IN (SELECT id::text FROM users);`);
        }
        lines.push('');
    }

    if (result.zombieMerchants.length > 0) {
        lines.push('-- 3. DELETE ZOMBIE MERCHANT RECORDS');
        for (const z of result.zombieMerchants) {
            lines.push(`-- DELETE FROM "${z.table}" WHERE "merchantId" NOT IN (SELECT id::text FROM merchants);`);
        }
        lines.push('');
    }

    lines.push('COMMIT;');
    lines.push('');
    lines.push('-- To reset sequences after cleanup:');
    lines.push("-- SELECT setval('table_id_seq', (SELECT COALESCE(MAX(id), 0) FROM table) + 1, false);");

    return lines.join('\n');
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          DATABASE AUDIT & CLEANUP SCRIPT                    ║');
    console.log('║          Order Management System                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        const result = await auditDatabase();

        console.log('\n=== SUMMARY ===\n');
        console.log(`Orphan tables: ${result.orphanTables.length}`);
        console.log(`Legacy columns: ${result.legacyColumns.length}`);
        console.log(`Zombie user records: ${result.zombieUsers.reduce((a, b) => a + b.count, 0)}`);
        console.log(`Zombie merchant records: ${result.zombieMerchants.reduce((a, b) => a + b.count, 0)}`);

        // Generate cleanup script
        const script = await generateCleanupScript(result);
        const scriptPath = path.join(__dirname, 'cleanup-generated.sql');
        fs.writeFileSync(scriptPath, script);
        console.log(`\n✓ Cleanup script generated: ${scriptPath}`);

    } catch (error) {
        console.error('Error during audit:', error);
        process.exit(1);
    }
}

main();
