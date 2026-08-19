import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 55%, #1e1b4b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 22,
            background: "#6366f1",
            color: "white",
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          OF
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "white" }}>
          OperFlow
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#94a3b8", marginTop: 16 }}>
          Run your field operations from one place
        </div>
      </div>
    ),
    { ...size }
  );
}
