import { ImageResponse } from "next/og";
import { RESTAURANT } from "@/lib/restaurant";

export const alt = `${RESTAURANT.name} — ${RESTAURANT.category} in ${RESTAURANT.city}, ${RESTAURANT.state}`;
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
          background: "#1F4D3A",
          color: "#F6F2EB",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#E2C48E" }}>
            {RESTAURANT.category} · {RESTAURANT.city}, {RESTAURANT.state}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 104, lineHeight: 1, letterSpacing: -2 }}>Saltwood</div>
            <div style={{ fontSize: 104, lineHeight: 1, letterSpacing: -2, color: "#E2C48E" }}>
              Kitchen
            </div>
            <div style={{ marginTop: 28, fontSize: 32, color: "rgba(246,242,235,0.85)", maxWidth: 620 }}>
              Wood-fired cooking and Texas-grown produce on Main Street.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                background: "#F6F2EB",
                color: "#1F4D3A",
                borderRadius: 999,
                padding: "16px 32px",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              Book a table online
            </div>
            <div style={{ fontSize: 28, color: "rgba(246,242,235,0.8)" }}>{RESTAURANT.phoneDisplay}</div>
          </div>
        </div>

        {/* Plate motif echoing the site's hero art */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: 75,
            width: 480,
            height: 480,
            borderRadius: 999,
            background: "#E7DCCB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 330,
              height: 330,
              borderRadius: 999,
              background: "#FFFFFF",
              border: "4px solid #E3DACD",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="264" height="186" viewBox="150 150 270 190">
              <rect x="178" y="286" width="96" height="20" rx="10" fill="#3C7A5C" transform="rotate(-10 226 296)" />
              <rect x="236" y="300" width="100" height="20" rx="10" fill="#2F6B52" transform="rotate(8 286 310)" />
              <path d="M172 236c10-44 118-60 170-34 28 14 26 60-4 76-44 24-146 20-162-6-7-11-7-24-4-36z" fill="#CF9A4E" />
              <path d="M212 222l18 48M248 212l20 58M286 210l18 54" stroke="#7D5A1F" strokeWidth="6" strokeLinecap="round" opacity="0.45" />
              <path d="M330 206a38 38 0 0 1 76 0z" fill="#F0CD6E" transform="rotate(-24 368 206)" />
            </svg>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
