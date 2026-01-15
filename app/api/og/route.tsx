import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get("title") || "GigHub - Serviços Locais"
    const description = searchParams.get("description") || "Conecte-se com prestadores de serviços locais"
    const category = searchParams.get("category")
    const price = searchParams.get("price")
    const rating = searchParams.get("rating")
    const location = searchParams.get("location")

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          backgroundImage: "linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "40px 60px 20px 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#0ea5e9",
            }}
          >
            🚀 GigHub
          </div>
          {category && (
            <div
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: 18,
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "0 60px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#1e293b",
              margin: "0 0 20px 0",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                fontSize: 24,
                color: "#64748b",
                margin: "0 0 30px 0",
                lineHeight: 1.4,
              }}
            >
              {description}
            </p>
          )}

          {/* Details */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "30px",
              fontSize: 20,
              color: "#475569",
            }}
          >
            {price && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>💰 {price}</div>}
            {rating && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>⭐ {rating}/5</div>}
            {location && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>📍 {location}</div>}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "20px 60px 40px 60px",
            fontSize: 18,
            color: "#64748b",
          }}
        >
          Serviços locais em Portugal • gighub.pt
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
