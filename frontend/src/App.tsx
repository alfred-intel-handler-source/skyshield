import { useCallback, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import SensorPanel from "./components/SensorPanel";
import EffectorPanel from "./components/EffectorPanel";
import TacticalMap from "./components/TacticalMap";
import TrackDetailPanel from "./components/TrackDetailPanel";
import EngagementPanel from "./components/EngagementPanel";
import EventLog from "./components/EventLog";
import DebriefScreen from "./components/DebriefScreen";
import ScenarioSelect from "./components/ScenarioSelect";
import LoadoutScreen from "./components/LoadoutScreen";
import PlacementScreen from "./components/PlacementScreen";
import CameraPanel from "./components/CameraPanel";
import { useWebSocket } from "./hooks/useWebSocket";
import type {
  BaseTemplate,
  CatalogEffector,
  CatalogSensor,
  EffectorStatus,
  EngagementZones,
  EventEntry,
  GamePhase,
  PlacementConfig,
  ScoreBreakdown,
  SensorStatus,
  ServerMessage,
  ThreatLevel,
  TrackData,
} from "./types";

const API_BASE = window.location.origin;

export default function App() {
  // --- Flow state ---
  const [phase, setPhase] = useState<GamePhase>("waiting");

  // Scenario + base selection
  const [scenarioId, setScenarioId] = useState<string>("");
  const [baseId, setBaseId] = useState<string>("");
  const [baseTemplate, setBaseTemplate] = useState<BaseTemplate | null>(null);

  // Equipment loadout
  const [selectedSensors, setSelectedSensors] = useState<CatalogSensor[]>([]);
  const [selectedEffectors, setSelectedEffectors] = useState<CatalogEffector[]>(
    [],
  );
  const [maxSensors, setMaxSensors] = useState(4);
  const [maxEffectors, setMaxEffectors] = useState(3);

  // Placement
  const [placementConfig, setPlacementConfig] =
    useState<PlacementConfig | null>(null);

  // Running phase state
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [sensors, setSensors] = useState<SensorStatus[]>([]);
  const [sensorConfigs, setSensorConfigs] = useState<SensorStatus[]>([]);
  const [effectors, setEffectors] = useState<EffectorStatus[]>([]);
  const [effectorConfigs, setEffectorConfigs] = useState<EffectorStatus[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>("green");
  const [scenarioName, setScenarioName] = useState("");
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [droneReachedBase, setDroneReachedBase] = useState(false);
  const [engagementZones, setEngagementZones] =
    useState<EngagementZones | null>(null);

  // Camera panel
  const [cameraTrackId, setCameraTrackId] = useState<string | null>(null);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "game_start":
        setScenarioName(msg.scenario.name);
        setSensors(msg.sensors);
        setSensorConfigs(msg.sensors);
        setEffectors(msg.effectors);
        setEffectorConfigs(msg.effectors);
        setEngagementZones(msg.engagement_zones);
        setPhase("running");
        setEvents([
          {
            timestamp: 0,
            message: `SCENARIO LOADED: ${msg.scenario.name}`,
          },
        ]);
        break;

      case "state":
        setTracks(msg.tracks);
        setElapsed(msg.elapsed);
        setTimeRemaining(msg.time_remaining);
        setThreatLevel(msg.threat_level);
        setSensors((prev) => {
          const configs = prev.length ? prev : [];
          return msg.sensors.map((s) => {
            const cfg = configs.find((c) => c.id === s.id);
            return cfg ? { ...cfg, ...s } : s;
          });
        });
        setEffectors((prev) => {
          const configs = prev.length ? prev : [];
          return msg.effectors.map((e) => {
            const cfg = configs.find((c) => c.id === e.id);
            return cfg ? { ...cfg, ...e } : e;
          });
        });

        if (msg.tracks.length > 0) {
          setSelectedTrackId((prev) => {
            if (prev && msg.tracks.some((t) => t.id === prev)) return prev;
            const first = msg.tracks.find((t) => !t.neutralized);
            return first ? first.id : prev;
          });
        }
        break;

      case "event":
        setEvents((prev) => [
          ...prev,
          { timestamp: msg.timestamp, message: msg.message },
        ]);
        break;

      case "engagement_result":
        setEvents((prev) => [
          ...prev,
          {
            timestamp: 0,
            message: `ENGAGEMENT: ${msg.effector.toUpperCase()} → ${msg.target_id.toUpperCase()} — ${msg.effective ? "EFFECTIVE" : "INEFFECTIVE"} (${(msg.effectiveness * 100).toFixed(0)}%)`,
          },
        ]);
        break;

      case "debrief":
        setScore(msg.score);
        setDroneReachedBase(msg.drone_reached_base);
        setPhase("debrief");
        break;
    }
  }, []);

  const { connect, send, connected } = useWebSocket(handleMessage);

  // --- Flow handlers ---

  const handleScenarioSelect = async (selScenarioId: string, selBaseId: string) => {
    setScenarioId(selScenarioId);
    setBaseId(selBaseId);

    // Fetch base template for the loadout screen limits
    try {
      const res = await fetch(`${API_BASE}/bases/${selBaseId}`);
      const data = await res.json();
      setBaseTemplate(data);
      setMaxSensors(data.max_sensors);
      setMaxEffectors(data.max_effectors);
    } catch {
      setMaxSensors(4);
      setMaxEffectors(3);
    }

    setPhase("equip");
  };

  const handleLoadoutConfirm = (
    sensors: CatalogSensor[],
    effectors: CatalogEffector[],
  ) => {
    setSelectedSensors(sensors);
    setSelectedEffectors(effectors);
    setPhase("plan");
  };

  const handlePlacementConfirm = (placement: PlacementConfig) => {
    setPlacementConfig(placement);
    // Reset running state
    setScore(null);
    setTracks([]);
    setSelectedTrackId(null);
    setEvents([]);
    setSensors([]);
    setSensorConfigs([]);
    setEffectors([]);
    setEffectorConfigs([]);
    setEngagementZones(null);
    setElapsed(0);
    setTimeRemaining(0);
    setThreatLevel("green");
    setCameraTrackId(null);

    // Connect with placement data
    connect({
      scenarioId,
      baseId,
      placement,
    });
  };

  const handleRestart = () => {
    send({ type: "restart" });
    // Go back to scenario select
    setPhase("waiting");
    setScore(null);
    setTracks([]);
    setSelectedTrackId(null);
    setEvents([]);
    setSensors([]);
    setSensorConfigs([]);
    setEffectors([]);
    setEffectorConfigs([]);
    setEngagementZones(null);
    setElapsed(0);
    setTimeRemaining(0);
    setThreatLevel("green");
    setCameraTrackId(null);
    setPlacementConfig(null);
  };

  const confirmTrack = (trackId: string) => {
    send({ type: "action", action: "confirm_track", target_id: trackId });
  };

  const identify = (
    trackId: string,
    classification: string,
    affiliation: string,
  ) => {
    send({
      type: "action",
      action: "identify",
      target_id: trackId,
      classification,
      affiliation,
    });
  };

  const engage = (trackId: string, effectorId: string) => {
    send({
      type: "action",
      action: "engage",
      target_id: trackId,
      effector: effectorId,
    });
  };

  const handleSlewCamera = (trackId: string) => {
    setCameraTrackId(trackId);
  };

  // --- Phase: Waiting (title screen) ---
  if (phase === "waiting") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1117",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(#1c233322 1px, transparent 1px), linear-gradient(90deg, #1c233322 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#e6edf3",
                letterSpacing: 6,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              SKYSHIELD
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#8b949e",
                letterSpacing: 4,
                textAlign: "center",
                marginTop: 4,
                fontWeight: 500,
              }}
            >
              C-UAS TRAINING SIMULATOR
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "20px 28px",
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 8,
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "#8b949e",
                letterSpacing: 1.5,
                marginBottom: 12,
              }}
            >
              TRAINING FLOW
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {["SELECT", "EQUIP", "PLAN", "EXECUTE", "DEBRIEF"].map(
                (step) => (
                  <span
                    key={step}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      background: "#21262d",
                      color: "#8b949e",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: 1,
                    }}
                  >
                    {step}
                  </span>
                ),
              )}
            </div>
            <div
              style={{
                color: "#8b949e",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Select a scenario and base, choose your equipment, plan your
              defense, then execute the DTID kill chain.
            </div>
          </div>

          <button
            onClick={() => setPhase("scenario_select")}
            style={{
              marginTop: 8,
              padding: "14px 56px",
              background: "#58a6ff",
              border: "none",
              borderRadius: 6,
              color: "#0d1117",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: "0 4px 16px rgba(88, 166, 255, 0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#79b8ff";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 6px 24px rgba(88, 166, 255, 0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#58a6ff";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 16px rgba(88, 166, 255, 0.3)";
            }}
          >
            BEGIN TRAINING
          </button>
        </div>
      </div>
    );
  }

  // --- Phase: Scenario Select ---
  if (phase === "scenario_select") {
    return <ScenarioSelect onSelect={handleScenarioSelect} />;
  }

  // --- Phase: Equipment Loadout ---
  if (phase === "equip") {
    return (
      <LoadoutScreen
        maxSensors={maxSensors}
        maxEffectors={maxEffectors}
        onConfirm={handleLoadoutConfirm}
        onBack={() => setPhase("scenario_select")}
      />
    );
  }

  // --- Phase: Placement ---
  if (phase === "plan" && baseTemplate) {
    return (
      <PlacementScreen
        baseTemplate={baseTemplate}
        selectedSensors={selectedSensors}
        selectedEffectors={selectedEffectors}
        onConfirm={handlePlacementConfirm}
        onBack={() => setPhase("equip")}
      />
    );
  }

  // --- Phase: Running ---
  const selectedTrack =
    tracks.find((t) => t.id === selectedTrackId) || null;
  const cameraTrack =
    cameraTrackId ? tracks.find((t) => t.id === cameraTrackId) || null : null;

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "48px 1fr 120px",
        gridTemplateColumns: "220px 1fr 280px",
        background: "#0d1117",
      }}
    >
      {/* Header */}
      <HeaderBar
        elapsed={elapsed}
        timeRemaining={timeRemaining}
        threatLevel={threatLevel}
        scenarioName={scenarioName}
      />

      {/* Left sidebar */}
      <div
        style={{
          gridRow: "2",
          gridColumn: "1",
          background: "#161b22",
          borderRight: "1px solid #30363d",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <SensorPanel sensors={sensors} />
        <EffectorPanel effectors={effectors} />
      </div>

      {/* Center: Tactical Map */}
      <div
        style={{
          gridRow: "2",
          gridColumn: "2",
          overflow: "hidden",
        }}
      >
        <TacticalMap
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          engagementZones={engagementZones}
          elapsed={elapsed}
        />
      </div>

      {/* Right sidebar */}
      <div
        style={{
          gridRow: "2",
          gridColumn: "3",
          background: "#161b22",
          borderLeft: "1px solid #30363d",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <TrackDetailPanel track={selectedTrack} />
        <EngagementPanel
          track={selectedTrack}
          effectors={effectors}
          sensors={sensorConfigs}
          onConfirmTrack={confirmTrack}
          onIdentify={identify}
          onEngage={engage}
          onSlewCamera={handleSlewCamera}
        />
      </div>

      {/* Bottom: Event Log */}
      <EventLog events={events} />

      {/* Camera panel overlay */}
      {cameraTrack && (
        <CameraPanel
          track={cameraTrack}
          onClose={() => setCameraTrackId(null)}
        />
      )}

      {/* Debrief overlay */}
      {phase === "debrief" && score && (
        <DebriefScreen
          score={score}
          droneReachedBase={droneReachedBase}
          scenarioName={scenarioName}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
