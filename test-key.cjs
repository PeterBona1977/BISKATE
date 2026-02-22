const https = require('https');

const API_KEY = 'AIzaSyDl4bAl19YTOBVN83mJ2TWitkXdn_8YpRs';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode !== 200) {
            console.log('Error:', data);
        } else {
            console.log('Success! Key is valid.');
        }
    });
}).on('error', (err) => {
    console.log('Network Error:', err.message);
});
