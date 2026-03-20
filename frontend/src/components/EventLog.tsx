import { useEffect, useRef } from "react";
import type { EventEntry, TrackData } from "../types";

interface Props {
  events: EventEntry[];
  hookedTrack?: TrackData | null;
  onUnhook?: () => void;
}

function getEventColor(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("engag") ||
    lower.includes("neutraliz") ||
    lower.includes("defeat") ||
    lower.includes("missed") ||
    lower.includes("effective")
  ) {
    return "#f85149";
  }
  if (
    lower.includes("warning") ||
    lower.includes("caution") ||
    lower.includes("unknown") ||
    lower.includes("lost")
  ) {
    return "#d29922";
  }
  if (
    lower.includes("detect") ||
    lower.includes("track") ||
    lower.includes("sensor") ||
    lower.includes("identif")
  ) {
    return "#58a6ff";
  }
  return "#8b949e";
}

const AFFILIATION_COLORS: Record<string, string> = {
  hostile: "#f85149",
  unknown: "#d29922",
  neutral: "#3fb950",
  friendly: "#58a6ff",
};

export default function EventLog({ events, hookedTrack, onUnhook }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events.length]);

  const affColor = hookedTrack
    ? AFFILIATION_COLORS[hookedTrack.affiliation] ?? "#8b949e"
    : "#8b949e";

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        height: 120,
        background: "#0c1015",
        borderTop: "1px solid #30363d",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* Left zone: Event Log (35%) */}
      <div
        style={{
          width: "35%",
          borderRight: "1px solid #21262d",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 14px",
            borderBottom: "1px solid #1c2333",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#8b949e",
              letterSpacing: 1.5,
            }}
          >
            EVENT LOG
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 9,
              color: "#484f58",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {events.length} events
          </span>
        </div>

        {/* Scrollable events */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "4px 14px",
          }}
        >
          {events.length === 0 && (
            <div
              style={{
                color: "#484f58",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                padding: "4px 0",
              }}
            >
              Awaiting mission events...
            </div>
          )}
          {events.map((evt, i) => {
            const color = getEventColor(evt.message);
            return (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.6,
                  color: color,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span style={{ color: "#484f58" }}>
                  [T+{evt.timestamp.toFixed(1)}s]
                </span>{" "}
                {evt.message}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right zone: Hook Bubble (65%) */}
      <div
        style={{
          width: "65%",
          background: "#0c1015",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {hookedTrack ? (
          <>
            {/* Top row: affiliation badge + track ID + unhook button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 14px",
                borderBottom: "1px solid #1c2333",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#0c1015",
                  background: affColor,
                  padding: "1px 6px",
                  borderRadius: 2,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {"\u25CF"} {hookedTrack.affiliation}
              </span>
              <span
                style={{
                  marginLeft: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#e6edf3",
                }}
              >
                {hookedTrack.id}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 9,
                  color: "#8b949e",
                  cursor: "pointer",
                  padding: "2px 6px",
                  border: "1px solid #30363d",
                  borderRadius: 3,
                }}
                onClick={onUnhook}
              >
                HOOK &times;
              </span>
            </div>

            {/* Data grid */}
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "2px 16px",
                padding: "6px 14px",
                alignContent: "start",
                overflow: "hidden",
              }}
            >
              <DataCell label="SPD" value={hookedTrack.speed_kts != null ? `${hookedTrack.speed_kts.toFixed(0)}kt` : "---"} />
              <DataCell label="ALT" value={hookedTrack.altitude_ft != null ? `${hookedTrack.altitude_ft.toFixed(0)}ft` : "---"} />
              <DataCell label="HDG" value={hookedTrack.heading_deg != null ? `${hookedTrack.heading_deg.toFixed(0)}\u00B0` : "---"} />
              <DataCell label="ETA" value={hookedTrack.eta_protected != null ? `${hookedTrack.eta_protected.toFixed(0)}s` : "---"} />
              <DataCell label="TYPE" value={hookedTrack.drone_type ?? "---"} />
              <DataCell label="DTID" value={hookedTrack.dtid_phase} badge badgeColor={affColor} />
              <DataCell label="CLASS" value={hookedTrack.classification ?? "---"} />
              <DataCell label="RF" value={hookedTrack.frequency_band ?? "---"} />
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#484f58", fontSize: 12 }}>
              NO TRACK HOOKED
            </span>
            <span style={{ color: "#30363d", fontSize: 10, marginTop: 4 }}>
              Click a track on the map to hook
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DataCell({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span
        style={{
          fontSize: 9,
          color: "#8b949e",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      {badge ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#0c1015",
            background: badgeColor ?? "#8b949e",
            padding: "0 4px",
            borderRadius: 2,
            textTransform: "uppercase",
          }}
        >
          {value}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: "#e6edf3" }}>{value}</span>
      )}
    </div>
  );
}
