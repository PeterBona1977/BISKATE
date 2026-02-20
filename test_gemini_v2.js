const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to load env vars
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.log("No .env.local found!");
        return {};
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim();
    });
    return env;
}

const env = loadEnv();
const keys = [
    env.GEMINI_API_KEY,
    env.GOOGLE_GENERATIVE_AI_API_KEY,
    env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
].filter(Boolean);

if (keys.length === 0) {
    console.log("No API keys found in .env.local");
    process.exit(1);
}

console.log(`Found ${keys.length} keys.`);

// Helper for fetch-like request
function request(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function test() {
    for (const key of keys) {
        console.log(`\nTesting Key: ${key.substring(0, 10)}...`);

        // 1. List Models
        for (const ver of ['v1', 'v1beta']) {
            console.log(`  Flagship list models check [${ver}]...`);
            try {
                const res = await request(`https://generativelanguage.googleapis.com/${ver}/models?key=${key}`);
                if (res.status === 200) {
                    const data = JSON.parse(res.body);
                    console.log(`    ✅ Success! Found ${data.models?.length} models.`);
                    data.models?.forEach(m => console.log(`      - ${m.name} (${m.supportedGenerationMethods?.join(',')})`));
                } else {
                    console.log(`    ❌ Failed: ${res.status} - ${res.body}`);
                }
            } catch (e) {
                console.log(`    ❌ Error: ${e.message}`);
            }
        }

        // 2. Try generateContent with common models
        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const model of modelsToTest) {
            for (const ver of ['v1', 'v1beta']) {
                console.log(`  Testing generateContent: ${model} [${ver}]...`);
                try {
                    const res = await request(
                        `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${key}`,
                        'POST',
                        JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                    );

                    if (res.status === 200) {
                        console.log(`    ✅ WORKING! Response: ${res.body.substring(0, 100)}...`);
                    } else {
                        console.log(`    ❌ Failed: ${res.status} - ${res.body}`);
                    }
                } catch (e) {
                    console.log(`    ❌ Error: ${e.message}`);
                }
            }
        }
    }
}

test();
