import { ImageResponse } from "next/og";
export const alt = "소득의 위치 — INCOME ATLAS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#101712",
        padding: "70px",
        color: "#f2f6ec",
        fontFamily: "sans-serif",
        border: "20px solid #24311e",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: "#c7f66b" }}>
        INCOME ATLAS
      </div>
      <div
        style={{ display: "flex", alignItems: "center", flex: 1, fontSize: 88, lineHeight: 1.15 }}
      >
        Know your position.
        <br />
        Plan your next.
      </div>
      <div style={{ display: "flex", fontSize: 25, color: "#a6b4a2" }}>
        Official sources. Transparent estimates. Private by design.
      </div>
    </div>,
    size,
  );
}
