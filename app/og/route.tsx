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
          background: "linear-gradient(135deg, #fffdf6 0%, #fff2d6 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: "85%",
          }}
        >
          {/* Logo with proper branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "2.5rem",
              background: "linear-gradient(135deg, #ffb400 0%, #e59600 100%)",
              borderRadius: "50%",
              width: "140px",
              height: "140px",
              boxShadow: "0 15px 35px rgba(255, 180, 0, 0.25)",
            }}
          >
            <span
              style={{
                fontSize: "4rem",
                color: "white",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Z
            </span>
          </div>

          {/* Main heading with improved typography */}
          <h1
            style={{
              fontSize: "4.5rem",
              fontWeight: "bold",
              color: "#201000",
              margin: "0 0 1.5rem 0",
              lineHeight: "1.1",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
            }}
          >
            Build Habits That
            <br />
            <span style={{ color: "#ffb400" }}>Actually Stick</span>
          </h1>

          {/* Subtitle with app branding */}
          <p
            style={{
              fontSize: "1.6rem",
              color: "#70531f",
              margin: "0 0 2.5rem 0",
              lineHeight: "1.4",
              maxWidth: "600px",
            }}
          >
            The citrus-powered ritual system that adapts to your energy and celebrates wins
          </p>

          {/* Call-to-action with improved styling */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.2rem",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "1.2rem 2.5rem",
              borderRadius: "60px",
              backdropFilter: "blur(15px)",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 180, 0, 0.2)",
            }}
          >
            <span
              style={{
                fontSize: "1.1rem",
                color: "#201000",
                fontWeight: "600",
              }}
            >
              Start Free Today
            </span>
            <div
              style={{
                width: "10px",
                height: "10px",
                background: "linear-gradient(135deg, #ffb400 0%, #e59600 100%)",
                borderRadius: "50%",
                boxShadow: "0 2px 4px rgba(255, 180, 0, 0.3)",
              }}
            />
          </div>

          {/* Brand tagline */}
          <div
            style={{
              marginTop: "2rem",
              fontSize: "1rem",
              color: "#c8ad7a",
              fontWeight: "500",
              letterSpacing: "0.5px",
            }}
          >
            z3st.app
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
