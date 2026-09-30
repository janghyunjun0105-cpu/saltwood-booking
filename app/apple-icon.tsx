import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS. Same mark as app/icon.svg, rendered to PNG. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1F4D3A",
          position: "relative",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32">
          <path
            d="M20.8 10.6c-1-1.2-2.6-1.9-4.5-1.9-2.8 0-4.8 1.5-4.8 3.7 0 4.9 9.6 3 9.6 7.4 0 1.8-1.8 3.1-4.4 3.1-2 0-3.8-.8-4.9-2.3"
            fill="none"
            stroke="#F6F2EB"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="23.5" cy="8.5" r="1.8" fill="#B7893A" />
        </svg>
      </div>
    ),
    size,
  );
}
