const fs = require('fs');
const path = require('path');

const NUM_ROWS = 50000;
const FRAUD_RATIO = 0.015;
const NUM_FRAUD = Math.floor(NUM_ROWS * FRAUD_RATIO);
const NUM_NORMAL = NUM_ROWS - NUM_FRAUD;
const NUM_USERS = 5000;

// simple seedable prng
let seed = 42;
function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

const user_ids = Array.from({length: NUM_USERS}, (_, i) => `U${String(i+1).padStart(5, '0')}`);

const normal_merchants = ['Groceries', 'Dining', 'Retail', 'Transportation', 'Entertainment', 'Subscription', 'Utilities'];
const fraud_merchants = ['Electronics', 'Jewelry', 'Crypto', 'Luxury Goods', 'Transfer'];
const normal_locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
const fraud_locations = ['Miami, FL', 'Seattle, WA', 'International_Unknown'];

function generate_transaction_data() {
    const data = [];
    const now = new Date();
    
    // Normal transactions
    for (let i = 0; i < NUM_NORMAL; i++) {
        const user = user_ids[Math.floor(random() * user_ids.length)];
        
        // Exponetial-like random amount
        const amount = Math.min(Math.round((-Math.log(1 - random()) * 50 + 10) * 100) / 100, 900);
        
        const daysAgo = Math.floor(random() * 30);
        const hour = Math.floor(random() * 18) + 6; // 6 to 23
        const minute = Math.floor(random() * 60);
        const timestamp = new Date(now.getTime() - (daysAgo * 86400000) - ((24 - hour) * 3600000) - (minute * 60000));
        
        const merchant = normal_merchants[Math.floor(random() * normal_merchants.length)];
        const location = normal_locations[Math.floor(random() * normal_locations.length)];
        const device = `DEV_${user}_1`;
        
        data.push({
            user_id: user, amount, time: timestamp, merchant, location, device, is_fraud: 0
        });
    }
    
    // Fraud transactions
    for (let i = 0; i < NUM_FRAUD; i++) {
        const user = user_ids[Math.floor(random() * user_ids.length)];
        
        const amount = Math.round((random() * 4000 + 1000) * 100) / 100; // 1000 to 5000
        
        const daysAgo = Math.floor(random() * 30);
        const hour = Math.floor(random() * 6); // 0 to 5
        const minute = Math.floor(random() * 60);
        const timestamp = new Date(now.getTime() - (daysAgo * 86400000) - ((24 - hour) * 3600000) - (minute * 60000));
        
        const merchant = fraud_merchants[Math.floor(random() * fraud_merchants.length)];
        const location = fraud_locations[Math.floor(random() * fraud_locations.length)];
        const device = `DEV_UNKNOWN_${Math.floor(random() * 9000) + 1000}`;
        
        data.push({
            user_id: user, amount, time: timestamp, merchant, location, device, is_fraud: 1
        });
    }
    
    // Shuffle using Fisher-Yates
    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }
    
    // Format rows
    const rows = data.map((row, i) => {
        const tx_id = `TXN${String(i+1).padStart(6, '0')}`;
        const timeStr = row.time.toISOString().replace('T', ' ').substring(0, 19);
        return `${tx_id},${row.user_id},${row.amount},${timeStr},${row.merchant},"${row.location}",${row.device},${row.is_fraud}`;
    });
    
    return rows;
}

const rows = generate_transaction_data();
const outputDir = path.join('C:', 'USM', 'VHACK_2026', 'VHack_2026', 'fraud-detection-system', 'backend', 'data');
fs.mkdirSync(outputDir, { recursive: true });

const header = 'transaction_id,user_id,transaction_amount,transaction_time,merchant_category,location,device_id,is_fraud';
fs.writeFileSync(path.join(outputDir, 'transactions.csv'), header + '\n' + rows.join('\n'));

console.log(`Generated ${rows.length} rows.`);
