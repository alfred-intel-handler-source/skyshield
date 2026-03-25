import type { EventEntry, ScoreBreakdown, TrackData } from "../types";
import "../styles/debrief.css";

interface Props {
  score: ScoreBreakdown;
  droneReachedBase: boolean;
  scenarioName: string;
  onRestart: () => void;
  onMainMenu: () => void;
  wavesCompleted?: number;
  elapsed?: number;
  events?: EventEntry[];
  tracks?: TrackData[];
}

const GRADE_COLORS: Record<string, string> = {
  S: "#d29922",
  A: "#3fb950",
  B: "#58a6ff",
  C: "#d29922",
  F: "#f85149",
};

function ScoreBar({ label, score, detail }: { label: string; score: number; detail: string }) {
  const color =
    score >= 80 ? "#3fb950" : score >= 50 ? "#d29922" : "#f85149";

  return (
    <div className="debrief-bar">
      <div className="debrief-bar-header">
        <span className="debrief-bar-label">{label}</span>
        <span className="debrief-bar-score" style={{ color }}>
          {score.toFixed(0)}
        </span>
      </div>
      <div className="debrief-bar-track">
        <div
          className="debrief-bar-fill"
          style={{
            width: `${Math.min(score, 100)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>
      {detail && <div className="debrief-bar-detail">{detail}</div>}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeStats(events: EventEntry[], tracks: TrackData[]) {
  let shotsFired = 0;
  let confirmedKills = 0;
  let misses = 0;
  let roeViolations = 0;
  let firstShotTime: number | null = null;
  let atcCalls = 0;
  let atcFriendly = 0;

  for (const evt of events) {
    const msg = evt.message;

    // Count engagements from ENGAGEMENT event messages
    if (msg.startsWith("ENGAGEMENT:")) {
      shotsFired++;
      if (msg.includes("EFFECTIVE")) {
        confirmedKills++;
      } else if (msg.includes("INEFFECTIVE")) {
        misses++;
      }
      if (firstShotTime === null) {
        firstShotTime = evt.timestamp;
      }
    }

    // ROE violations
    if (msg.includes("ROE VIOLATION") || msg.includes("blue-on-blue") || msg.includes("FRIENDLY FIRE")) {
      roeViolations++;
    }

    // ATC calls
    if (msg.includes("ATC") || msg.includes("RADIO") || msg.includes("airspace cleared") || msg.includes("clear_airspace")) {
      atcCalls++;
      if (msg.includes("FRIENDLY") || msg.includes("friendly")) {
        atcFriendly++;
      }
    }
  }

  // Count threats: non-ambient, non-interceptor tracks
  const allTracks = tracks.filter(
    (t) => !t.is_ambient && !t.is_interceptor
  );
  const totalThreats = allTracks.length;
  const detectedThreats = allTracks.filter(
    (t) => t.dtid_phase !== "detected" || t.sensors_detecting.length > 0 || t.neutralized
  ).length;

  const accuracy = shotsFired > 0 ? Math.round((confirmedKills / shotsFired) * 100) : 0;

  return {
    shotsFired,
    confirmedKills,
    misses,
    accuracy,
    roeViolations,
    firstShotTime,
    totalThreats,
    detectedThreats,
    atcCalls,
    atcFriendly,
  };
}

function Stat({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="debrief-stat">
      <span className="debrief-stat-label">{label}</span>
      <span className={`debrief-stat-value ${colorClass ?? ""}`}>{value}</span>
    </div>
  );
}

export default function DebriefScreen({
  score,
  droneReachedBase,
  scenarioName,
  onRestart,
  onMainMenu,
  wavesCompleted,
  elapsed = 0,
  events = [],
  tracks = [],
}: Props) {
  const gradeColor = GRADE_COLORS[score.grade] || "#8b949e";
  const hasPlacement =
    score.placement_score !== null && score.placement_score !== undefined;

  const stats = computeStats(events, tracks);

  return (
    <div className="debrief-overlay">
      <div className="debrief-card">
        {/* --- Header --- */}
        <div className="debrief-header">
          <div className="debrief-label">MISSION DEBRIEF</div>
          <div className="debrief-scenario">
            {scenarioName}
            {wavesCompleted != null && wavesCompleted > 1 && (
              <span style={{ marginLeft: 8, color: "#58a6ff", fontSize: 11 }}>
                ({wavesCompleted} WAVES)
              </span>
            )}
          </div>

          {droneReachedBase && (
            <div className="debrief-base-compromised">BASE COMPROMISED</div>
          )}

          <div className="debrief-grade" style={{ color: gradeColor }}>
            {score.grade}
          </div>
          <div className="debrief-total" style={{ color: gradeColor }}>
            {score.total_score.toFixed(0)} / 100
          </div>

          {score.completion_multiplier < 1.0 && (
            <div className="debrief-time-bonus">{score.time_bonus_detail}</div>
          )}
        </div>

        {/* --- Mission Stats --- */}
        <div className="debrief-section-label">MISSION STATS</div>
        <div className="debrief-stats-grid">
          <Stat label="TIME ELAPSED" value={formatTime(elapsed)} colorClass="debrief-stat-value--cyan" />
          <Stat
            label="THREATS"
            value={`${stats.detectedThreats} / ${stats.totalThreats}`}
            colorClass={stats.detectedThreats >= stats.totalThreats ? "debrief-stat-value--green" : "debrief-stat-value--yellow"}
          />
          <Stat label="SHOTS FIRED" value={String(stats.shotsFired)} />
          <Stat
            label="CONFIRMED KILLS"
            value={String(stats.confirmedKills)}
            colorClass={stats.confirmedKills > 0 ? "debrief-stat-value--green" : undefined}
          />
          <Stat label="MISSES" value={String(stats.misses)} colorClass={stats.misses > 0 ? "debrief-stat-value--red" : undefined} />
          <Stat
            label="ACCURACY"
            value={stats.shotsFired > 0 ? `${stats.accuracy}%` : "N/A"}
            colorClass={stats.accuracy >= 75 ? "debrief-stat-value--green" : stats.accuracy >= 50 ? "debrief-stat-value--yellow" : stats.shotsFired > 0 ? "debrief-stat-value--red" : undefined}
          />
          <Stat
            label="ROE VIOLATIONS"
            value={String(stats.roeViolations)}
            colorClass={stats.roeViolations > 0 ? "debrief-stat-value--red" : "debrief-stat-value--green"}
          />
          <Stat
            label="TIME TO FIRST SHOT"
            value={stats.firstShotTime !== null ? `${stats.firstShotTime.toFixed(1)}s` : "N/A"}
          />
          {stats.atcCalls > 0 && (
            <>
              <Stat label="ATC CALLS" value={String(stats.atcCalls)} colorClass="debrief-stat-value--cyan" />
              <Stat
                label="ATC RESOLVED FRIENDLY"
                value={String(stats.atcFriendly)}
                colorClass={stats.atcFriendly > 0 ? "debrief-stat-value--green" : undefined}
              />
            </>
          )}
        </div>

        {/* --- Execution Scores --- */}
        <div className="debrief-section-label">EXECUTION</div>

        <ScoreBar
          label="DETECTION AWARENESS (12%)"
          score={score.detection_awareness_score}
          detail={score.details.detection_awareness || ""}
        />
        <ScoreBar
          label="CONFIRMATION QUALITY (8%)"
          score={score.confirmation_quality_score}
          detail={score.details.confirmation_quality || ""}
        />
        <ScoreBar
          label="TRACKING (15%)"
          score={score.tracking_score}
          detail={score.details.tracking || ""}
        />
        <ScoreBar
          label="IDENTIFICATION (25%)"
          score={score.identification_score}
          detail={score.details.identification || ""}
        />
        <ScoreBar
          label="DEFEAT METHOD (25%)"
          score={score.defeat_score}
          detail={score.details.defeat || ""}
        />
        <ScoreBar
          label="ROE COMPLIANCE (15%)"
          score={score.roe_score}
          detail={score.details.roe || ""}
        />

        {/* --- Placement Scores --- */}
        {hasPlacement && score.placement_details && (
          <>
            <div className="debrief-section-label debrief-section-label--border">
              DEFENSE PLANNING
            </div>

            <ScoreBar
              label="OVERALL PLACEMENT"
              score={score.placement_score!}
              detail=""
            />
            <ScoreBar
              label="APPROACH COVERAGE (40%)"
              score={parseScoreFromDetail(score.placement_details.coverage)}
              detail={score.placement_details.coverage || ""}
            />
            <ScoreBar
              label="SENSOR OVERLAP (25%)"
              score={parseScoreFromDetail(score.placement_details.overlap)}
              detail={score.placement_details.overlap || ""}
            />
            <ScoreBar
              label="EFFECTOR REACH (25%)"
              score={parseScoreFromDetail(score.placement_details.effector_reach)}
              detail={score.placement_details.effector_reach || ""}
            />
            <ScoreBar
              label="LOS MANAGEMENT (10%)"
              score={parseScoreFromDetail(score.placement_details.los)}
              detail={score.placement_details.los || ""}
            />
          </>
        )}

        {/* --- Action Buttons --- */}
        <div className="debrief-buttons">
          <button className="debrief-btn debrief-btn--primary" onClick={onRestart}>
            REPLAY
          </button>
          <button className="debrief-btn debrief-btn--secondary" onClick={onMainMenu}>
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function parseScoreFromDetail(detail: string | undefined): number {
  if (!detail) return 0;
  const match = detail.match(/(\d+)\/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    const den = parseInt(match[2], 10);
    return den > 0 ? (num / den) * 100 : 0;
  }
  const pctMatch = detail.match(/(\d+)%/);
  if (pctMatch) {
    return parseInt(pctMatch[1], 10);
  }
  return 0;
}
