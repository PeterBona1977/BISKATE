const fs = require('fs');
const path = require('path');

async function testGemini() {
    const apiKey = "AIzaSyC2FQrcNgpM6JeTsmCfLUa7N4pZ82WpmvE";
    console.log(`Testing new key: ${apiKey.substring(0, 10)}...`);

    const modelNames = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

    // 1. List Models
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(listUrl);
        if (res.ok) {
            console.log("✅ ListModels: SUCCESS");
            const data = await res.json();
            const available = data.models.map(m => m.name);
            fs.writeFileSync('available_models.txt', JSON.stringify(available, null, 2));
            console.log(`Saved ${available.length} models to available_models.txt`);
        } else {
            console.error(`❌ ListModels: FAILED ${res.status}`);
        }
    } catch (e) { console.error("ListModels Exception", e.message); }

    // 2. Generate Content
    for (const model of modelNames) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
            });
            if (res.ok) {
                console.log(`✅ Generate [${model}]: SUCCESS`);
                return;
            } else {
                console.log(`❌ Generate [${model}]: FAILED ${res.status}`);
            }
        } catch (e) {
            console.log(`❌ Generate [${model}]: ERROR ${e.message}`);
        }
    }
}

testGemini();
