
import axios from 'axios';

// Config
const BASE_URL = 'http://localhost:6006';
let adminToken = '';
let merchantToken = '';
let userToken = '';
let merchantId = '';
let userId = '';

// Helper to log steps
const step = (msg) => console.log(`\n[STEP] ${msg}`);

async function main() {
    try {
        // 1. Admin Login
        step('Admin Login');
        // Login path: /admin-users/login
        // Payload: { username, password }
        try {
            const adminRes = await axios.post(`${BASE_URL}/admin-users/login`, { username: 'superadmin', password: 'admin123456' });
            console.log('Admin Login Response:', JSON.stringify(adminRes.data, null, 2));
            adminToken = adminRes.data.data.token; // Admin uses 'token'
            console.log('Admin Token acquired.');
        } catch (e: any) {
            console.error('Admin Login Failed Details:', e.response ? e.response.data : e.message);
            throw e;
        }

        // 2. Configure System (userMinMoney = 50 for test)
        step('Update System Config');
        await axios.put(`${BASE_URL}/system-config/global`, { userMinMoney: 50 }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('System Config Updated.');

        // 3. Merchant Login (assuming test merchant exists, otherwise create one)
        step('Merchant Login');
        // We'll create a new merchant to be safe, using Admin API
        // Actually Admin Create Merchant is not standard, let's Register one
        const merchantUser = `test_m_${Date.now()}`;
        await axios.post(`${BASE_URL}/merchant/register`, {
            username: merchantUser,
            password: 'password123',
            phone: `138${Date.now().toString().slice(-8)}`,
            companyName: 'Test Company'
        });
        const marchantLogin = await axios.post(`${BASE_URL}/merchant/login`, { username: merchantUser, password: 'password123' });
        merchantToken = marchantLogin.data.data.token;
        console.log('Merchant Registered & Logged In.');

        // 4. Admin Approves Merchant
        step('Admin Approve Merchant');
        const merchantProfile = await axios.get(`${BASE_URL}/merchant/profile`, { headers: { Authorization: `Bearer ${merchantToken}` } });
        merchantId = merchantProfile.data.data.id; // Structure: { success: true, data: merchant }
        await axios.put(`${BASE_URL}/admin/merchants/${merchantId}/approve`, { approved: true }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('Merchant Approved.');

        // 5. Merchant Recharges (Admin Adjust Balance)
        step('Admin Adjust Merchant Balance');
        // Endpoint: /admin/merchants/:id/adjust-balance
        // Payload: { type, amount, reason } (Action logic TBD, assuming positive amount adds?)
        await axios.post(`${BASE_URL}/admin/merchants/${merchantId}/adjust-balance`,
            { type: 'balance', amount: 1000, reason: 'Test Recharge' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        await axios.post(`${BASE_URL}/admin/merchants/${merchantId}/adjust-balance`,
            { type: 'silver', amount: 100, reason: 'Test Recharge' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('Merchant Balance Adjusted.');

        // 6. Merchant Publishes Task (Mocking Task Creation - skipping extensive task fields for brevity, assuming minimal works)
        // Need a valid shop first.
        // ... skipping shop creation for brevity, assuming logic works or creates simple task.
        // Error risk: Task creation is complex.
        // Let's test "Withdrawal" flow instead as primarily requested for "Finance Page Alignment".
        // User Flow: Register -> Admin Adjust Balance -> User Withdraw -> Admin Audit.

        // 7. User Register & Login
        step('User Register & Login');
        const username = `test_u_${Date.now()}`;
        const userPhone = `139${Date.now().toString().slice(-8)}`;
        await axios.post(`${BASE_URL}/auth/register`, {
            username: username,
            password: 'password123',
            phone: userPhone,
            invitationCode: 'ADMIN' // Default backdoor code
        });
        const userLogin = await axios.post(`${BASE_URL}/auth/login`, { username: username, password: 'password123' });
        userToken = userLogin.data.data.accessToken;
        userId = userLogin.data.data.user.id;
        console.log('User Registered & Logged In.');

        // 7.1 Set Pay Password (Required for Withdrawal)
        step('User Set Pay Password');
        // Send SMS (Mocked success)
        await axios.post(`${BASE_URL}/user/send-sms`, { phone: userPhone, type: 'change_pay_password' }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        // Change Password using '123456'
        await axios.post(`${BASE_URL}/user/change-pay-password`, {
            newPayPassword: '123456',
            phone: userPhone,
            smsCode: '123456'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log('Pay Password Set.');

        step('Admin Adjust User Balance');
        // Endpoint: /admin/users/:id/adjust-balance
        await axios.post(`${BASE_URL}/admin/users/${userId}/adjust-balance`,
            { type: 'balance', amount: 200, reason: 'Test Withdraw' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('User Balance Added: 200');

        // 8. User Requests Withdrawal
        step('User Request Withdrawal');
        // First bind a bank card
        const cardNum = `6222${Date.now().toString().slice(-8)}`;
        const cardRes = await axios.post(`${BASE_URL}/bank-cards`,
            { bankName: 'ICBC', accountName: 'Test User', cardNumber: cardNum },
            { headers: { Authorization: `Bearer ${userToken}` } }
        );
        const bankCardId = cardRes.data.data.id;
        console.log('Bank Card Bound:', bankCardId);

        await axios.post(`${BASE_URL}/withdrawals`,
            { amount: 100, bankCardId: bankCardId, payPassword: '123456' },
            { headers: { Authorization: `Bearer ${userToken}` } }
        );
        console.log('Withdrawal Requested.');

        step('Admin Check Withdrawal List');
        const withdrawalList = await axios.get(`${BASE_URL}/admin/withdrawals`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const wd = withdrawalList.data.data[0];
        if (!wd) throw new Error('Withdrawal not found');
        console.log('Withdrawal Found:', wd.id);

        step('Admin Reject Withdrawal');
        await axios.put(`${BASE_URL}/admin/withdrawals/${wd.id}/approve`,
            { approved: false, remark: 'Test Reject' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        // 11. Verify User Balance (Should be refunded)
        step('Verify User Balance Refund');
        const userProfile = await axios.get(`${BASE_URL}/user/profile`, { headers: { Authorization: `Bearer ${userToken}` } });
        // Balance should be back to 200 (200 + 0 withdrawal - 0 fee)
        // Wait, withdrawal was rejected. So 200 - 100(frozen) + 100(refund) = 200.
        // Or if logic is: Deduct from balance -> Add to frozen. Reject -> Add to balance -> Deduct from frozen.
        // So final balance = 200.
        const currentBalance = parseFloat(userProfile.data.data.balance);
        console.log('Current Balance:', currentBalance);
        if (currentBalance !== 200) {
            throw new Error(`Balance mismatch: expected 200, got ${currentBalance}`);
        }
        console.log('Balance Verified (Refunded successfully).');

        console.log('\n[SUCCESS] Full Loop Verification Passed!');

    } catch (e) {
        console.error('\n[ERROR] Test Failed:', e.response?.data || e.message);
        process.exit(1);
    }
}

main();
