const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDtxLebf3PUeSv_5SC-52k3_Q4wpql73Mc";

async function findWorkingModel() {
    console.log("🔍 Starting definitive model search...");

    // 1. Fetch all models via REST to get raw names
    try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const listData = await listRes.json();

        if (!listData.models) {
            console.error("❌ Could not list models:", JSON.stringify(listData));
            return;
        }

        const generateModels = listData.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", ""));

        console.log(`📋 Found ${generateModels.length} potential models:`, generateModels.join(", "));

        // 2. Test each model
        console.log("\n🧪 Testing generation on candidates...");

        for (const modelName of generateModels) {
            process.stdout.write(`   Testing [${modelName}] ... `);
            try {
                const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Hello, answer with OK." }] }]
                    })
                });

                const genData = await genRes.json();

                if (genRes.ok && genData.candidates && genData.candidates.length > 0) {
                    console.log("✅ SUCCESS!");
                    console.log(`\n🎉 FOUND WORKING MODEL: "${modelName}"`);
                    return; // Stop at first working model
                } else {
                    console.log(`❌ FAILED (${genRes.status}: ${genData.error?.message?.slice(0, 50)}...)`);
                }
            } catch (e) {
                console.log(`❌ ERROR (${e.message})`);
            }
        }

        console.log("\n⚠️ No working models found in the list.");

    } catch (error) {
        console.error("❌ Fatal error:", error);
    }
}

findWorkingModel();
