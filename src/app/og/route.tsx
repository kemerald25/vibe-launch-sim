import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { CARD_COLORS, CARD_ROUTE_COLORS } from "@/config/site";
import { buildCardData } from "@/lib/cardData";
import { defaultConfig, isValid, validateConfig } from "@/lib/schema";
import { simulate } from "@/lib/simulate";
import { formatBps } from "@/lib/units";
import { decodeConfig } from "@/lib/urlState";

const WIDTH = 1200;
const HEIGHT = 630;

/** Open Graph image for a shared configuration. Same content as the downloadable card. */
export async function GET(request: NextRequest) {
  const decoded = decodeConfig(request.nextUrl.searchParams);
  const config = isValid(validateConfig(decoded)) ? decoded : defaultConfig();
  const data = buildCardData(simulate(config));
  const c = CARD_COLORS;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: c.bg,
        color: c.text,
        padding: 56,
        border: `2px solid ${c.line}`,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ marginRight: 14 }}>
              <rect
                x="1.5"
                y="1.5"
                width="21"
                height="21"
                rx="4"
                stroke={c.accent}
                strokeWidth="1.8"
              />
              <path d="M6.5 12l3.5 3.5 7.5-8" stroke={c.accent} strokeWidth="2" />
            </svg>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>{data.siteName}</div>
          </div>
          <div style={{ display: "flex", fontSize: 18, color: c.muted, letterSpacing: 1 }}>
            LAUNCH SIMULATION
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 54,
            fontWeight: 600,
            marginTop: 40,
            maxWidth: 1088,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {data.title}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: c.body, marginTop: 6 }}>
          {data.subtitle}
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {data.stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              height: 132,
              padding: "16px 18px",
              marginLeft: i === 0 ? 0 : 16,
              background: c.surface,
              border: `1px solid ${c.line}`,
            }}
          >
            <div style={{ display: "flex", fontSize: 16, color: c.muted, letterSpacing: 1 }}>
              {stat.label.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: stat.estimate ? 26 : 44,
                fontWeight: 600,
                marginTop: stat.estimate ? 14 : 8,
                color: stat.estimate ? c.text : c.accent,
              }}
            >
              {stat.value}
            </div>
            {stat.estimate ? (
              <div style={{ display: "flex", fontSize: 14, color: c.muted, marginTop: 6 }}>
                MODEL ESTIMATE
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 16, color: c.muted, letterSpacing: 1 }}>
          {data.segmentsTitle.toUpperCase()}
        </div>
        <div style={{ display: "flex", width: "100%", height: 26, marginTop: 10 }}>
          {data.segments.map((segment) => (
            <div
              key={segment.id}
              style={{
                display: "flex",
                width: `${segment.bps / 100}%`,
                height: 26,
                background: CARD_ROUTE_COLORS[segment.id],
                borderRight: `2px solid ${c.bg}`,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 14 }}>
          {data.segments.map((segment) => (
            <div
              key={segment.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: 28,
                fontSize: 19,
                color: c.body,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  marginRight: 8,
                  background: CARD_ROUTE_COLORS[segment.id],
                }}
              />
              {`${segment.label} ${formatBps(segment.bps)}`}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderTop: `1px solid ${c.line}`,
          paddingTop: 16,
        }}
      >
        <div style={{ display: "flex", fontSize: 21, fontWeight: 600 }}>{data.unofficialLabel}</div>
        <div style={{ display: "flex", fontSize: 16, color: c.muted, marginTop: 6 }}>
          {`${data.checkedLabel}  ·  Testnet  ·  Estimates are not protocol data`}
        </div>
      </div>
    </div>,
    { width: WIDTH, height: HEIGHT },
  );
}
