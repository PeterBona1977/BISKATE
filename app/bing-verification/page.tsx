import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verificação Bing - Biskate",
  other: {
    "msvalidate.01": "B128E07173F88C1FD2F70E3CAB33C87A",
  },
}

export default function BingVerificationPage() {
  return (
    <html>
      <head>
        <meta name="msvalidate.01" content="B128E07173F88C1FD2F70E3CAB33C87A" />
        <title>Verificação Bing - Biskate</title>
      </head>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Verificação Bing</h1>
            <p>Esta página contém a meta tag de verificação do Bing.</p>
            <p className="mt-2 text-sm text-gray-600">
              Meta tag: &lt;meta name="msvalidate.01" content="B128E07173F88C1FD2F70E3CAB33C87A" /&gt;
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
