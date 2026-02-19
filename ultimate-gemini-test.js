const keys = [
    "AIzaSyC2FQrcNgpM6JeTsmCfLUa7N4pZ82WpmvE", // .env.local
    "AIzaSyDtxLebf3PUeSv_5SC-52k3_Q4wpql73Mc", // debug-gemini.js
    "AIzaSyDqEI4PK4Hp1mnaex46aKl6-n3d-7EiRKQ"  // Maps key
];

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-2.0-flash-exp",
    "gemini-pro",
    "gemini-1.0-pro"
];

const versions = ["v1", "v1beta"];

async function runTest() {
    console.log("🚀 Starting Ultimate Gemini Discovery...");

    for (const key of keys) {
        console.log(`\n--- Testing Key: ${key.substring(0, 10)}... ---`);

        // 1. Try ListModels
        for (const v of versions) {
            try {
                const url = `https://generativelanguage.googleapis.com/${v}/models?key=${key}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const names = data.models ? data.models.map(m => m.name.replace("models/", "")) : [];
                    console.log(`✅ [${v}] ListModels: Found ${names.length} models.`);
                    if (names.length > 0) {
                        console.log(`   Models: ${names.join(", ").substring(0, 200)}...`);
                    }
                } else {
                    console.log(`❌ [${v}] ListModels Failed: ${res.status}`);
                }
            } catch (e) {
                console.log(`❌ [${v}] ListModels Error: ${e.message}`);
            }
        }

        // 2. Try Brute Force generateContent
        for (const model of models) {
            for (const v of versions) {
                try {
                    const url = `https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${key}`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                    });

                    if (res.ok) {
                        console.log(`⭐️ SUCCESS: [${model}] on [${v}] WORKS!`);
                        const data = await res.json();
                        console.log(`   Sample: ${JSON.stringify(data).substring(0, 50)}...`);
                    } else {
                        // Only log if not 404/403 to keep output clean, unless it's the last one
                        if (res.status !== 404 && res.status !== 403) {
                            console.log(`⚠️  [${model}] on [${v}] returned ${res.status}`);
                        }
                    }
                } catch (e) { }
            }
        }
    }
}

runTest();
