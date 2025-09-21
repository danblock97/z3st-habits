import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
          fontFamily: "Geist Sans, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "2rem",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              borderRadius: "50%",
              width: "120px",
              height: "120px",
              boxShadow: "0 10px 25px rgba(245, 158, 11, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "3rem",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Z
            </span>
          </div>

          <h1
            style={{
              fontSize: "4rem",
              fontWeight: "bold",
              color: "#1f2937",
              margin: "0 0 1rem 0",
              lineHeight: "1.1",
            }}
          >
            Build Habits That
            <br />
            <span style={{ color: "#f59e0b" }}>Actually Stick</span>
          </h1>

          <p
            style={{
              fontSize: "1.5rem",
              color: "#6b7280",
              margin: "0 0 2rem 0",
              lineHeight: "1.4",
            }}
          >
            The citrus-powered ritual system for creators
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "rgba(255, 255, 255, 0.8)",
              padding: "1rem 2rem",
              borderRadius: "50px",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <span
              style={{
                fontSize: "0.9rem",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Start Free Today
            </span>
            <div
              style={{
                width: "8px",
                height: "8px",
                background: "#10b981",
                borderRadius: "50%",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
