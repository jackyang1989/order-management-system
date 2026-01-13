#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * CI Gate: Task Configuration Consistency Checker
 * 
 * Verifies that all mandatory fields in TaskFieldSpec are present in the source code
 * of Merchant, Admin, and Buyer centers.
 */

const TASK_FIELDS = [
    { key: 'taskType', must: ['merchant', 'admin', 'user_claim', 'user_execute'] },
    { key: 'terminal', must: ['merchant', 'admin', 'user_claim', 'user_execute'] },
    { key: 'isFreeShipping', must: ['merchant', 'admin', 'user_claim', 'user_execute'] },
    { key: 'compareCount', must: ['merchant', 'admin', 'user_execute'] },
    { key: 'contactCSContent', must: ['merchant', 'admin', 'user_execute'] },
    { key: 'checkPassword', must: ['merchant', 'admin', 'user_claim', 'user_execute'] },
    { key: 'weight', must: ['merchant', 'admin'] },
    { key: 'fastRefund', must: ['merchant', 'admin'] },
];

const ROUTES = {
    merchant: 'frontend/src/app/merchant/tasks/[id]/page.tsx',
    admin: 'frontend/src/app/admin/tasks/page.tsx',
    user_claim: 'frontend/src/app/tasks/[id]/page.tsx',
    user_execute: 'frontend/src/app/orders/[id]/execute/page.tsx',
};

let errors = 0;

console.log('--- Task Consistency CI Gate ---');

Object.entries(ROUTES).forEach(([role, filePath]) => {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`[ERROR] File missing: ${filePath}`);
        errors++;
        return;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    
    TASK_FIELDS.forEach(field => {
        if (field.must.includes(role)) {
            // Check if field key is present in content (primitive check for references)
            if (!content.includes(field.key)) {
                console.error(`[ERROR] Missing mandatory field "${field.key}" in ${role} (${filePath})`);
                errors++;
            } else {
                console.log(`[OK] ${role} has ${field.key}`);
            }
        }
    });
});

if (errors > 0) {
    console.error(`\nFound ${errors} consistency errors.`);
    process.exit(1);
} else {
    console.log('\nAll task configuration fields are consistent across 3-ends.');
    process.exit(0);
}
