export async function GET() {
  const html = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Yandex Verification</title>
    </head>
    <body>Verification: c6d07a4007c19007</body>
</html>`

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  })
}
