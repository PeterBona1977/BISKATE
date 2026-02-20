const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to load env vars
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
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

const logFile = path.resolve(process.cwd(), 'gemini_results.txt');
fs.writeFileSync(logFile, `Test started at ${new Date().toISOString()}\nFound ${keys.length} keys.\n`);

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

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
        log(`\n--------------------------------------------------`);
        log(`Testing Key: ${key.substring(0, 10)}...`);

        // Check ListModels
        for (const ver of ['v1beta', 'v1']) {
            const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${key}`;
            try {
                const res = await request(url);
                if (res.status === 200) {
                    const data = JSON.parse(res.body);
                    const names = data.models ? data.models.map(m => m.name.replace('models/', '')) : [];
                    log(`  [${ver}] ListModels: SUCCESS (${names.length} models)`);
                    log(`      Models: ${names.join(', ')}`);
                } else {
                    log(`  [${ver}] ListModels: FAILED (${res.status})`);
                    log(`      Response: ${res.body.replace(/\n/g, ' ')}`);
                }
            } catch (e) {
                log(`  [${ver}] ListModels: ERROR ${e.message}`);
            }
        }

        // Check GenerateContent
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            try {
                const res = await request(url, 'POST', JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] }));
                if (res.status === 200) {
                    log(`  [${model}] Generate: SUCCESS`);
                } else {
                    log(`  [${model}] Generate: FAILED (${res.status})`);
                    // log(`      Response: ${res.body.replace(/\n/g, ' ')}`);
                }
            } catch (e) {
                log(`  [${model}] Generate: ERROR ${e.message}`);
            }
        }
    }
}

test();
