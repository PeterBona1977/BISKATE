const fetch = require('node-fetch'); // If you are on node 18+, fetch is built-in. Otherwise we might need to adjust.
// Actually lets use built-in https for maximum compatibility to test the key
const https = require('https');

require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ No GEMINI_API_KEY found in .env.local! Please add it safely.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data.substring(0, 500) + '...');
    });
}).on('error', (err) => {
    console.log('Network Error:', err.message);
});
