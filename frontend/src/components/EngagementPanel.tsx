import type { EffectorStatus, SensorStatus, TrackData } from "../types";

interface Props {
  track: TrackData | null;
  effectors: EffectorStatus[];
  sensors: SensorStatus[];
  onConfirmTrack: (trackId: string) => void;
  onIdentify: (trackId: string, classification: string, affiliation: string) => void;
  onEngage: (trackId: string, effectorId: string) => void;
  onSlewCamera?: (trackId: string) => void;
}

const CLASSIFICATIONS = [
  { value: "commercial_quad", label: "COMMERCIAL QUAD", affiliation: "hostile" },
  { value: "fixed_wing", label: "FIXED-WING UAS", affiliation: "hostile" },
  { value: "micro", label: "MICRO UAS", affiliation: "hostile" },
  { value: "improvised", label: "IMPROVISED UAS", affiliation: "hostile" },
  { value: "bird", label: "BIRD (FALSE ALARM)", affiliation: "neutral" },
  { value: "weather_balloon", label: "WEATHER BALLOON (FALSE ALARM)", affiliation: "neutral" },
];

const EFFECTOR_COLORS: Record<string, string> = {
  jammer: "#58a6ff",
  rf_jam: "#58a6ff",
  kinetic: "#f85149",
  interceptor: "#3fb950",
  net_interceptor: "#3fb950",
  de_weapon: "#bc8cff",
  directed_energy: "#bc8cff",
};

function isInEoirFov(track: TrackData, sensors: SensorStatus[]): boolean {
  const eoirSensors = sensors.filter(
    (s) => s.type === "eoir" && s.status === "active",
  );
  for (const sensor of eoirSensors) {
    const sx = sensor.x ?? 0;
    const sy = sensor.y ?? 0;
    const dist = Math.sqrt((track.x - sx) ** 2 + (track.y - sy) ** 2);
    const range = sensor.range_km ?? 1.5;
    if (dist > range) continue;

    const fov = sensor.fov_deg ?? 360;
    if (fov >= 360) return true;

    const bearing =
      ((Math.atan2(track.x - sx, track.y - sy) * 180) / Math.PI + 360) % 360;
    const facing = sensor.facing_deg ?? 0;
    const diff = Math.abs(((bearing - facing + 180) % 360) - 180);
    if (diff <= fov / 2) return true;
  }
  return false;
}

export default function EngagementPanel({
  track,
  effectors,
  sensors,
  onConfirmTrack,
  onIdentify,
  onEngage,
  onSlewCamera,
}: Props) {
  if (!track) {
    return (
      <div
        style={{
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#484f58",
          fontSize: 12,
          letterSpacing: 1,
          minHeight: 120,
        }}
      >
        SELECT A TRACK
      </div>
    );
  }

  const canSlew =
    (track.dtid_phase === "tracked" || track.dtid_phase === "identified") &&
    isInEoirFov(track, sensors);

  return (
    <div style={{ padding: "12px 14px", minHeight: 120 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#8b949e",
          letterSpacing: 1.5,
          marginBottom: 10,
        }}
      >
        ENGAGEMENT
      </div>

      {track.dtid_phase === "detected" && (
        <div>
          <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 8 }}>
            Confirm track for continuous monitoring
          </div>
          <button
            onClick={() => onConfirmTrack(track.id)}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#58a6ff18",
              border: "1px solid #58a6ff55",
              borderRadius: 6,
              color: "#58a6ff",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: 1,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#58a6ff30";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#58a6ff18";
            }}
          >
            CONFIRM TRACK
          </button>
        </div>
      )}

      {track.dtid_phase === "tracked" && (
        <div>
          {/* SLEW CAMERA button */}
          {canSlew && onSlewCamera && (
            <button
              onClick={() => onSlewCamera(track.id)}
              style={{
                width: "100%",
                padding: "9px 12px",
                marginBottom: 8,
                background: "#d2992218",
                border: "1px solid #d2992244",
                borderRadius: 5,
                color: "#d29922",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 1,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#d2992230";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#d2992218";
              }}
            >
              SLEW CAMERA
            </button>
          )}

          {!canSlew && (
            <div
              style={{
                fontSize: 10,
                color: "#484f58",
                marginBottom: 8,
                padding: "6px 8px",
                background: "#161b22",
                border: "1px solid #21262d",
                borderRadius: 4,
                letterSpacing: 0.5,
              }}
            >
              {sensors.some((s) => s.type === "eoir")
                ? "TARGET NOT IN CAMERA FOV"
                : "NO EO/IR CAMERA AVAILABLE"}
            </div>
          )}

          <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 8 }}>
            Classify the contact
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CLASSIFICATIONS.map((cls) => (
              <button
                key={cls.value}
                onClick={() => onIdentify(track.id, cls.value, cls.affiliation)}
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  background:
                    cls.affiliation === "hostile" ? "#f8514911" : "#3fb95011",
                  border: `1px solid ${cls.affiliation === "hostile" ? "#f8514933" : "#3fb95033"}`,
                  borderRadius: 4,
                  color:
                    cls.affiliation === "hostile" ? "#f85149" : "#3fb950",
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: 0.5,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    cls.affiliation === "hostile" ? "#f8514925" : "#3fb95025";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    cls.affiliation === "hostile" ? "#f8514911" : "#3fb95011";
                }}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {track.dtid_phase === "identified" && (
        <div>
          {/* SLEW CAMERA in identified phase too */}
          {canSlew && onSlewCamera && (
            <button
              onClick={() => onSlewCamera(track.id)}
              style={{
                width: "100%",
                padding: "9px 12px",
                marginBottom: 8,
                background: "#d2992218",
                border: "1px solid #d2992244",
                borderRadius: 5,
                color: "#d29922",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 1,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#d2992230";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#d2992218";
              }}
            >
              SLEW CAMERA
            </button>
          )}
          <div style={{ fontSize: 11, color: "#8b949e", marginBottom: 8 }}>
            Select effector to engage
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {effectors.map((eff) => {
              const color =
                EFFECTOR_COLORS[eff.id] ||
                EFFECTOR_COLORS[eff.type || ""] ||
                "#58a6ff";
              const name = eff.name || eff.id.toUpperCase();
              const isReady = eff.status === "ready";

              return (
                <button
                  key={eff.id}
                  onClick={() => isReady && onEngage(track.id, eff.id)}
                  disabled={!isReady}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: isReady ? `${color}15` : "#161b22",
                    border: `1px solid ${isReady ? `${color}44` : "#30363d"}`,
                    borderRadius: 5,
                    color: isReady ? color : "#484f58",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: 0.5,
                    cursor: isReady ? "pointer" : "not-allowed",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.15s",
                    opacity: isReady ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (isReady)
                      (e.currentTarget as HTMLElement).style.background = `${color}28`;
                  }}
                  onMouseLeave={(e) => {
                    if (isReady)
                      (e.currentTarget as HTMLElement).style.background = `${color}15`;
                  }}
                >
                  <span>{name}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 500,
                      opacity: 0.7,
                    }}
                  >
                    {eff.status.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {track.dtid_phase === "defeated" && (
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: track.neutralized ? "#3fb950" : "#f85149",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            {track.neutralized ? "NEUTRALIZED" : "MISSED"}
          </div>
          <div style={{ fontSize: 11, color: "#8b949e" }}>
            {track.neutralized
              ? "Target has been neutralized"
              : "Engagement was not effective"}
          </div>
        </div>
      )}
    </div>
  );
}
