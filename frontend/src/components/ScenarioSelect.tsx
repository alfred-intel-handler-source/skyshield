import { useState, useEffect } from "react";
import type { ScenarioInfo, BaseInfo } from "../types";

interface Props {
  onSelect: (scenarioId: string, baseId: string) => void;
}

const API_BASE = window.location.origin;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#3fb950",
  medium: "#d29922",
  hard: "#f85149",
};

const SIZE_COLORS: Record<string, string> = {
  small: "#3fb950",
  medium: "#d29922",
  large: "#f85149",
};

export default function ScenarioSelect({ onSelect }: Props) {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [bases, setBases] = useState<BaseInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/scenarios`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch scenarios");
        return r.json();
      }),
      fetch(`${API_BASE}/bases`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch bases");
        return r.json();
      }),
    ])
      .then(([scenarioData, baseData]) => {
        setScenarios(scenarioData);
        setBases(baseData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const canContinue = selectedScenario !== null && selectedBase !== null;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Inter', sans-serif",
        color: "#e6edf3",
        overflow: "auto",
      }}
    >
      {/* Title */}
      <div
        style={{
          marginTop: 48,
          marginBottom: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#e6edf3",
          }}
        >
          SKYSHIELD
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#8b949e",
            letterSpacing: 2,
            fontWeight: 500,
          }}
        >
          C-UAS TRAINING SIMULATOR
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 24,
          marginBottom: 32,
          fontSize: 14,
          color: "#8b949e",
          letterSpacing: 1,
        }}
      >
        SELECT SCENARIO & BASE
      </div>

      {loading && (
        <div style={{ fontSize: 14, color: "#8b949e", marginTop: 48 }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{ fontSize: 14, color: "#f85149", marginTop: 48 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Two-column layout */}
          <div
            style={{
              display: "flex",
              gap: 32,
              width: "100%",
              maxWidth: 960,
              padding: "0 24px",
              boxSizing: "border-box",
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Scenarios column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8b949e",
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                SCENARIOS
              </div>
              {scenarios.map((s) => {
                const isSelected = selectedScenario === s.id;
                const diffColor =
                  DIFFICULTY_COLORS[s.difficulty.toLowerCase()] || "#8b949e";
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id)}
                    style={{
                      background: "#161b22",
                      border: isSelected
                        ? "1px solid #58a6ff"
                        : "1px solid #30363d",
                      borderRadius: 8,
                      padding: 16,
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        {s.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: 1,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: `${diffColor}18`,
                          border: `1px solid ${diffColor}55`,
                          color: diffColor,
                          textTransform: "uppercase",
                        }}
                      >
                        {s.difficulty}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#8b949e",
                        lineHeight: 1.5,
                      }}
                    >
                      {s.description}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bases column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8b949e",
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                BASE TEMPLATES
              </div>
              {bases.map((b) => {
                const isSelected = selectedBase === b.id;
                const sizeColor =
                  SIZE_COLORS[b.size.toLowerCase()] || "#8b949e";
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBase(b.id)}
                    style={{
                      background: "#161b22",
                      border: isSelected
                        ? "1px solid #58a6ff"
                        : "1px solid #30363d",
                      borderRadius: 8,
                      padding: 16,
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        {b.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: 1,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: `${sizeColor}18`,
                          border: `1px solid ${sizeColor}55`,
                          color: sizeColor,
                          textTransform: "uppercase",
                        }}
                      >
                        {b.size}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#8b949e",
                        lineHeight: 1.5,
                        marginBottom: 10,
                      }}
                    >
                      {b.description}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        fontSize: 11,
                        color: "#8b949e",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span>
                        Sensors: <span style={{ color: "#e6edf3" }}>{b.max_sensors}</span>
                      </span>
                      <span>
                        Effectors: <span style={{ color: "#e6edf3" }}>{b.max_effectors}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue button */}
          <div style={{ padding: "32px 0 48px" }}>
            <button
              disabled={!canContinue}
              onClick={() => {
                if (selectedScenario && selectedBase) {
                  onSelect(selectedScenario, selectedBase);
                }
              }}
              style={{
                padding: "12px 48px",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 1.5,
                border: "none",
                borderRadius: 8,
                cursor: canContinue ? "pointer" : "default",
                background: canContinue ? "#58a6ff" : "#30363d",
                color: canContinue ? "#0d1117" : "#484f58",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              CONTINUE
            </button>
          </div>
        </>
      )}
    </div>
  );
}
