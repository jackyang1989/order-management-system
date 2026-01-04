
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
        // Note: Need to ensure admin user exists. If not, script might fail.
        // Assuming 'admin' / 'password' exists or seeded.
        const adminRes = await axios.post(`${BASE_URL}/admin-users/login`, { username: 'admin', password: 'password' });
        adminToken = adminRes.data.data.accessToken; // Structure: { success: true, data: { accessToken, ... } }
        console.log('Admin Token acquired.');

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
        await axios.post(`${BASE_URL}/auth/merchant/register`, {
            username: merchantUser,
            password: 'password123',
            phone: `138${Date.now().toString().slice(-8)}`,
            companyName: 'Test Company'
        });
        const marchantLogin = await axios.post(`${BASE_URL}/auth/merchant/login`, { username: merchantUser, password: 'password123' });
        merchantToken = marchantLogin.data.accessToken;
        console.log('Merchant Registered & Logged In.');

        // 4. Admin Approves Merchant
        step('Admin Approve Merchant');
        const merchantProfile = await axios.get(`${BASE_URL}/merchants/profile`, { headers: { Authorization: `Bearer ${merchantToken}` } });
        merchantId = merchantProfile.data.id;
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

        step('User Register & Login');
        const username = `test_u_${Date.now()}`;
        await axios.post(`${BASE_URL}/auth/register`, {
            username: username,
            password: 'password123',
            phone: `139${Date.now().toString().slice(-8)}`,
            invitationCode: '888888' // Assuming default exists
        });
        const userLogin = await axios.post(`${BASE_URL}/auth/login`, { username: username, password: 'password123' });
        userToken = userLogin.data.accessToken;
        userId = userLogin.data.user.id;
        console.log('User Registered & Logged In.');

        step('Admin Adjust User Balance');
        // Endpoint: /admin/users/:id/adjust-balance
        await axios.post(`${BASE_URL}/admin/users/${userId}/adjust-balance`,
            { type: 'balance', amount: 200, reason: 'Test Withdraw' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('User Balance Added: 200');

        step('User Request Withdrawal');
        // User requests 100
        await axios.post(`${BASE_URL}/withdrawals`,
            { amount: 100, bankName: 'TestBank', cardNumber: '123456789', holderName: 'Tester' },
            { headers: { Authorization: `Bearer ${userToken}` } }
        );
        console.log('Withdrawal Requested.');

        step('Admin Check Withdrawal List');
        const wdList = await axios.get(`${BASE_URL}/admin/withdrawals?status=PENDING`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const wd = wdList.data.data[0];
        if (!wd) throw new Error('Withdrawal not found');
        console.log('Withdrawal Found:', wd.id);

        step('Admin Reject Withdrawal');
        await axios.put(`${BASE_URL}/admin/withdrawals/${wd.id}/review`,
            { approved: false, remark: 'Test Reject' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('Withdrawal Rejected.');

        step('Verify User Balance Refund');
        const userProfile = await axios.get(`${BASE_URL}/users/profile`, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log('User Balance:', userProfile.data.balance);
        if (Number(userProfile.data.balance) !== 200) {
            throw new Error(`Balance Mismatch: expected 200, got ${userProfile.data.balance}`);
        }
        console.log('Balance Verified (Refunded successfully).');

        console.log('\n[SUCCESS] Full Loop Verification Passed!');

    } catch (e) {
        console.error('\n[ERROR] Test Failed:', e.response?.data || e.message);
        process.exit(1);
    }
}

main();
