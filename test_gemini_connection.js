const fs = require('fs');
const path = require('path');

const logFile = path.resolve(process.cwd(), 'gemini_log.txt');
fs.writeFileSync(logFile, ''); // Clear log

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function testGemini() {
    // 1. Load Environment Variables
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        log("No .env.local found!");
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });

    const keys = [
        env.GEMINI_API_KEY,
        env.GOOGLE_GENERATIVE_AI_API_KEY,
        env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ].filter(Boolean);

    log(`Found ${keys.length} keys to test.`);

    const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-flash-latest"];
    const apiVersions = ["v1", "v1beta"];

    for (const apiKey of keys) {
        log(`\nTesting Key: ${apiKey.substring(0, 10)}...`);

        // Test ListModels first
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        try {
            const res = await fetch(listUrl);
            if (res.ok) {
                const data = await res.json();
                const modelNames = data.models ? data.models.map(m => m.name) : [];
                log(`✅ ListModels Success. Found ${modelNames.length} models.`);
                log(`   Available: ${modelNames.join(', ').substring(0, 200)}...`);
            } else {
                log(`❌ ListModels Failed: ${res.status} ${res.statusText}`);
                try {
                    const txt = await res.text();
                    log(`   Response: ${txt.substring(0, 200)}...`);
                } catch (e) { }
            }
        } catch (err) {
            log(`❌ ListModels Error: ${err.message}`);
        }

        for (const name of modelNames) {
            for (const ver of apiVersions) {
                const url = `https://generativelanguage.googleapis.com/${ver}/models/${name}:generateContent?key=${apiKey}`;
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.candidates) {
                            log(`✅ SUCCESS: [${name}] [${ver}]`);
                            log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
                            return; // Stop after first success
                        }
                    } else {
                        log(`❌ FAILED: [${name}] [${ver}] Status: ${res.status} ${res.statusText}`);
                        try {
                            const txt = await res.text();
                            log(`   Response: ${txt.substring(0, 200)}...`); // Truncate response
                        } catch (e) { }
                    }
                } catch (err) {
                    log(`❌ ERROR: [${name}] [${ver}] ${err.message}`);
                }
            }
        }
    }
    log("\nAll attempts finished.");
}

testGemini();
