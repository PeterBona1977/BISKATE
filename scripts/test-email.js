const { Resend } = require('resend');

// Manually Load Env Vars (simple approach for test script)
// Replace this with your actual key for the test if it's not loading
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_AHZZaP2v_PWVn6urcxA1Le76sRzL5Ek9Z';

const resend = new Resend(RESEND_API_KEY);

async function sendTestEmail() {
    console.log('Sending test email...');
    console.log('API Key:', RESEND_API_KEY.substring(0, 5) + '...');
    console.log('From: GigHub <noreply@biskate.eu>');
    console.log('To: peterbona1977@gmail.com');

    try {
        const { data, error } = await resend.emails.send({
            from: 'GigHub <noreply@biskate.eu>',
            to: ['peterbona1977@gmail.com'],
            subject: 'Manual Test Email',
            html: '<strong>It works!</strong> This is a manual test from the script.',
        });

        if (error) {
            console.error('❌ Resend Error:', error);
        } else {
            console.log('✅ Email sent successfully!', data);
        }
    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

sendTestEmail();
