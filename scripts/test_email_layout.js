
const fs = require('fs');
const path = require('path');

function wrapEmail(body, subject) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f8fafc;
            padding-bottom: 40px;
        }
        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px 30px;
            color: #1e293b;
            line-height: 1.6;
            font-size: 16px;
        }
        .footer {
            background-color: #0f172a;
            color: #94a3b8;
            padding: 40px 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer a {
            color: #818cf8;
            text-decoration: none;
        }
        .social-links {
            margin-bottom: 20px;
        }
        .social-links span {
            display: inline-block;
            margin: 0 10px;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
        }
        hr {
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main">
            <tr>
                <td class="header">
                    <h1>GigHub</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <h1>Olá Pedro!</h1>
                    <p>Este é um exemplo de como os teus novos emails do GigHub vão aparecer.</p>
                    <p>Adicionámos um cabeçalho vibrante e um rodapé profissional para melhorar a experiência dos teus utilizadores.</p>
                    <a href="#" class="button">Ver Transações</a>
                    <hr />
                    <p>Se tiveres alguma dúvida, não hesites em contactar-nos.</p>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <div class="social-links">
                        <span>LinkedIn</span>
                        <span>Twitter</span>
                        <span>Instagram</span>
                    </div>
                    <p>&copy; ${new Date().getFullYear()} GigHub. Todos os direitos reservados.</p>
                    <p>Enviado com ❤️ pela equipa GigHub</p>
                    <p>
                        <a href="mailto:support@biskate.eu">support@biskate.eu</a> | 
                        <a href="https://biskate.eu">biskate.eu</a>
                    </p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
    `;
}

const html = wrapEmail('', 'Test Email');
fs.writeFileSync(path.join(__dirname, 'test_email.html'), html);
console.log('Test email generated at test_email.html');
