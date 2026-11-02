import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Tifawave Surf Stay · Tamraght, Morocco";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "#173f39",
        color: "#f6f1e7",
      }}
    >
      <div style={{ fontSize: 26, letterSpacing: 8, marginBottom: 38 }}>
        TAMRAGHT · MOROCCO
      </div>
      <div style={{ fontSize: 112, fontWeight: 700 }}>Tifawave.</div>
      <div style={{ fontSize: 38, marginTop: 24 }}>Surf Stay</div>
      <div style={{ fontSize: 24, marginTop: 55, color: "#dfbc91" }}>
        Rooms · Surf packages · Group stays
      </div>
    </div>,
    size,
  );
}
