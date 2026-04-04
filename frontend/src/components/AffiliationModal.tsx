import { useCallback, useEffect, useState } from "react";

interface Props {
  trackId: string;
  trackLabel: string;
  classification: string | null;
  onDeclare: (trackId: string, affiliation: "hostile" | "neutral" | "friendly") => void;
}

const AFFILIATIONS = [
  {
    value: "hostile" as const,
    label: "HOSTILE",
    icon: "\u2620",
    color: "#f85149",
    bgHover: "#f8514930",
    desc: "Threat confirmed — defeat options will unlock",
  },
  {
    value: "neutral" as const,
    label: "NEUTRAL",
    icon: "\u25CB",
    color: "#00c853",
    bgHover: "#00c85330",
    desc: "Non-threat — track will be dismissed",
  },
  {
    value: "friendly" as const,
    label: "FRIENDLY",
    icon: "\u2714",
    color: "#00bfbf",
    bgHover: "#00bfbf30",
    desc: "Confirmed friendly — track will be dismissed",
  },
];

export default function AffiliationModal({
  trackId,
  trackLabel,
  classification,
  onDeclare,
}: Props) {
  const [animState, setAnimState] = useState<"entering" | "visible">("entering");
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimState("visible"));
    });
  }, []);

  const handleDeclare = useCallback(
    (affiliation: "hostile" | "neutral" | "friendly") => {
      onDeclare(trackId, affiliation);
    },
    [trackId, onDeclare],
  );

  const isVisible = animState === "visible";
  const classLabel = classification?.replace(/_/g, " ").toUpperCase() ?? "UNKNOWN";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isVisible ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isVisible ? "blur(4px)" : "none",
        transition: "background 200ms ease-out, backdrop-filter 200ms ease-out",
      }}
    >
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: 12,
          padding: "28px 32px",
          minWidth: 360,
          maxWidth: 440,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.92) translateY(12px)",
          transition: "opacity 200ms ease-out, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#d29922",
            letterSpacing: 2,
            marginBottom: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          DECLARE AFFILIATION
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#e6edf3",
            marginBottom: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {trackLabel.toUpperCase()}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#8b949e",
            marginBottom: 20,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Classified as <span style={{ color: "#d29922", fontWeight: 600 }}>{classLabel}</span>
          {" "}&mdash; confirm disposition before proceeding
        </div>

        {/* Affiliation buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {AFFILIATIONS.map((aff) => (
            <button
              key={aff.value}
              onClick={() => handleDeclare(aff.value)}
              onMouseEnter={() => setHoveredValue(aff.value)}
              onMouseLeave={() => setHoveredValue(null)}
              style={{
                width: "100%",
                padding: "14px 18px",
                background: hoveredValue === aff.value ? aff.bgHover : `${aff.color}10`,
                border: `1px solid ${hoveredValue === aff.value ? aff.color : `${aff.color}44`}`,
                borderRadius: 8,
                color: aff.color,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 1.5,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{aff.icon}</span>
              <div>
                <div>{aff.label}</div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    color: "#8b949e",
                    letterSpacing: 0.3,
                    marginTop: 2,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {aff.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ROE reminder */}
        <div
          style={{
            marginTop: 16,
            padding: "8px 12px",
            background: "#d2992210",
            border: "1px solid #d2992233",
            borderRadius: 6,
            fontSize: 9,
            color: "#d29922",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 0.5,
            lineHeight: 1.5,
          }}
        >
          ROE: Verify threat disposition before engagement. Incorrect declarations are scored.
        </div>
      </div>
    </div>
  );
}
