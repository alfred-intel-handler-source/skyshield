# CLAUDE.md — SKYSHIELD Project Guide (Updated 2026-03-17)

## What Is This?
SKYSHIELD is a **free, browser-based C-UAS training simulator** designed to teach military operators the **DTID kill chain** (Detect → Track → Identify → Defeat). It's built to feel like a real FAAD C2 or Medusa workstation. No clearance required — purely training.

**Target User:** "The E-5 who gets handed the C-UAS binder and told to figure it out."

**Vision:** Deployable worldwide so any military member can train C-UAS operations without needing real systems at their base.

## Current State (55 commits, ~16,400 lines)

### Core Features ✅
- **DTID Kill Chain:** Detect (radar) → Track (persist) → Identify (visual on camera) → Defeat (kinetic/EW)
- **Fictional Equipment (inspired by real systems):** AN/TPQ-51 (360° radar), KURZ FCS (fire-control radar), EO/IR Camera (pan/tilt camera), RF/PNT Jammer, JACKAL (4 interceptors per pallet), SHINOBI (RF detect 8km + Protocol Manipulation defeat 6km)
- **Real-World Maps:** Leaflet.js + OpenStreetMap satellite imagery. Location search (Nominatim geocoding). Any real-world location.
- **FAAD C2 / Medusa UI Patterns:**
  - Radial Action Wheel (Wheel of Death) — right-click tracks for actions
  - Track Data Blocks (Hook Bubbles) — persistent info labels on all tracks
  - Device WOD — right-click sensors/effectors
  - Range rings (color-coded per system with labels)
  - Track coasting (24s extrapolation, faded icons)
  - Hold Fire (dashed box, engagement lockout)
  - Protected/Warning areas with ETA countdown
  - Track alerts (blinking, banners, escalating alarms)

- **EO/IR Camera:** Pan/tilt gimbal, auto-track, manual slew with virtual joystick, zoom 1x-8x, 6 animated thermal silhouettes (quadcopter, fixed-wing, passenger aircraft, bird, balloon, micro drone)
- **Web Audio Synthesis:** 10 sound effects (detection ping, engagement, alarms, camera slew, etc.) — all synthesized, no audio files
- **Continuous Operations (No Auto-End):**
  - Mission runs indefinitely until player hits END MISSION button
  - Waves of threats escalate in difficulty
  - Wave counter in header
  - 30-60s pause between waves
  - Ambient air traffic (commercial planes, military jets, birds, weather balloons)
  
- **SHINOBI (Combined Detect + Defeat System):**
  - Single integrated system — one catalog entry in `combined` section (not separate sensor+effector)
  - RF-based detect-track-identify-defeat system (not radar)
  - Multi-band RF detection: 2.4GHz, 5.8GHz, 430MHz, 900MHz
  - Library-based — only detects drones with matching RF signatures
  - Detect range 8km, Defeat range 6km (two purple range rings from one placement)
  - 3 countermeasure types via Protocol Manipulation:
    - HOLD: Freeze drone in place (hover lock)
    - LAND NOW: Forced controlled descent to ground
    - DEAFEN: Sever control link (drone enters failsafe behavior)
  - CM state progression: pending → 1/2 (downlink only) → 2/2 (uplink active, full control)
  - Track data shows frequency band, CM state (1/2 or 2/2)
  - Autonomous/non-RF targets are immune (fixed-wing 30% resist chance)
  - Radial Action Wheel: select SHINOBI effector → CM submenu (HOLD/LAND NOW/DEAFEN)
  - Equipment catalog: `combined` array (auto-creates sensor + effector at same position when placed)
  - Loadout: appears in "COMBINED SYSTEMS" section, counts toward both sensor and effector totals
  - Placement: purple hexagon icon, two range rings (detect=purple, defeat=violet)

- **Realistic EW Jamming:**
  - Jammer activates regardless of range (radiates omnidirectionally)
  - Effect only applies when target is in 3km range
  - Jammed drones don't vanish — they enter 5-10s jammed state with random behavior (drift/crash, RTH, forced landing, GPS spoof)
  - Commercial quads always affected. Autonomous fixed-wing can resist (30% chance)
  - "JAMMED" label on track data blocks

- **JACKAL Full Lifecycle:**
  - Launch: JKIL-XX appears as green friendly track at pallet position
  - Midcourse (150kts): KURZ FCS radar guides, flying toward target
  - Terminal (200kts): seeker acquires within 0.3km
  - Intercept: 85% success rate within 0.05km
  - Miss: re-engage once more (max 2 attempts), then self-destruct at 328ft
  - Hold Fire abort: Jackal self-destructs
  - Map visualization: green triangle icon, dashed trail, intercept vector line
  - Camera: approaching Jackal as pulsing dot + explosion sequence (white flash → fireball → smoke)

### Game Flow
1. **Waiting/Title** — QUICK START (pre-loaded, straight to running) or CUSTOM MISSION
2. **Scenario Select** — Choose from 4 scenarios: Lone Wolf (1 drone), Swarm Attack (5), Recon Probe (3 + trigger discipline), Tutorial (guided)
3. **Loadout** — Select equipment: 1x TPQ-51, 1x KURZ FCS, 2x EO/IR Camera, 2x JACKAL Pallets, 1x RF Jammer (Quick Start preset)
4. **Placement** — Drag sensors/effectors onto real satellite map. See coverage zones, gaps. Toggle range rings per system.
5. **Running** — Mission executes. Player:
   - Watches radar for contacts
   - Confirms tracks (switches to TRACKED phase)
   - Slews EO/IR Camera for visual ID
   - Classifies (commercial quad, fixed-wing, bird, balloon, etc.)
   - Engages with Jackal or jammer
   - Monitors Jackal flight and intercept
   - Manages ROE (don't shoot friendlies)
   - After all threats neutralized, mission pauses 30-60s then spawns next wave
6. **END MISSION** — Jumps to debrief
7. **Debrief** — Cumulative scoring across all waves: DTID accuracy, reaction time, ROE violations, engagement effectiveness

### Tech Stack
- **Backend:** FastAPI (Python 3.13), WebSocket at 10Hz tick rate
- **Frontend:** React 19, TypeScript, Vite, Leaflet.js, HTML5 Canvas
- **Maps:** OpenStreetMap satellite + CartoDB Dark Matter tiles (free)
- **Data:** JSON scenarios + base templates + equipment catalog

### File Structure

**Frontend Key Files:**
- `App.tsx` — State machine, WebSocket management, phase transitions
- `TacticalMap.tsx` — Leaflet map, drone/Jackal rendering, track interactions
- `CameraPanel.tsx` — Canvas thermal camera, silhouettes, explosion effects
- `EngagementPanel.tsx` — DTID phase UI (confirm/identify/engage buttons)
- `RadialActionWheel.tsx` — Right-click pie menu for tracks and devices
- `PlacementScreen.tsx` — Drag-drop sensor/effector placement on real maps
- `types.ts` — All TypeScript interfaces (TrackData, SensorConfig, etc.)

**Backend Key Files:**
- `main.py` — FastAPI app + game loop (drone movement, detection, jamming, Jackal intercept logic)
- `models.py` — Pydantic models (DroneState, SensorConfig, EffectorConfig, CatalogCombined, DTIDPhase, etc.)
- `helpers.py` — Placement → config builders (build_sensors_from_placement, build_effectors_from_placement) — handles combined systems auto-split
- `scenario.py` — Load scenario JSON files
- `detection.py` — Multi-sensor detection simulation (includes SHINOBI RF detection logic)
- `ninja.py` — SHINOBI Protocol Manipulation logic (CM types, state progression, RF band matching)
- `drone.py` — Drone movement behaviors (direct_approach, orbit, waypoint_path, evasive, etc.)
- `coyote.py` — JACKAL interceptor flight phases (launch, midcourse, terminal, intercept)
- `jamming.py` — RF/PNT jammer activation and effect logic
- `waves.py` — Wave spawning and escalation for continuous operations
- `actions.py` — Player action handlers (confirm, identify, engage, hold fire)
- `game_state.py` — Game state management and tick orchestration
- `scoring.py` — DTID scoring engine (5 categories, S-F grades)
- `config.py` — App configuration constants
- `security.py` — WebSocket security and validation

**Data Files:**
- `backend/scenarios/` — lone_wolf.json, swarm_attack.json, recon_probe.json, tutorial.json
- `backend/bases/` — small_fob.json, medium_airbase.json, large_installation.json

**Docker Files (present but not yet polished):**
- `docker-compose.yml` — Full stack orchestration
- `backend/Dockerfile` + `backend/.dockerignore`
- `frontend/Dockerfile` + `frontend/.dockerignore` + `frontend/nginx.conf`
- `backend/equipment/catalog.json` — Sensor + effector + combined system specs (range, FOV, ammo count, etc.). Three top-level arrays: `sensors`, `effectors`, `combined`

### Key Code Patterns

**Game Loop (main.py):**
```python
# Every tick (10Hz = 100ms):
# 1. Move drones based on behavior (direct_approach, orbit, etc.)
# 2. Move Jackal interceptors (launch → midcourse → terminal → intercept)
# 3. Update sensor detection (multi-sensor fusion, confidence buildup)
# 4. Handle player actions (confirm, identify, engage, hold fire)
# 5. Build state message (tracks, sensor status, effector status, protected area)
# 6. Send to frontend via WebSocket
```

**Combined System Pattern (helpers.py):**
```python
# When player places a combined item (e.g. SHINOBI), the backend auto-creates
# both a sensor and an effector at the same position:
# - build_sensors_from_placement() iterates placement.combined → creates SensorConfig
#   with id="combined_sensor_0_shinobi", type=cat.sensor_type, range=cat.sensor_range_km
# - build_effectors_from_placement() iterates placement.combined → creates EffectorConfig
#   with id="combined_effector_0_shinobi", type=cat.effector_type, range=cat.effector_range_km
# Frontend sends: { combined: [{ catalog_id: "shinobi", lat: ..., lng: ... }] }
```

**WebSocket Messages:**
- `game_start` — Sent once when mission begins. Includes scenario name, sensor list, effector list, engagement zones.
- `state` — Sent every tick. Tracks array (with `is_interceptor`, `intercept_phase` for Jackals), elapsed time, threat level, sensor configs.
- `event` — Sent on significant events ("TRACK CONFIRMED", "JACKAL LAUNCHED", "HOLD FIRE ACTIVATED", etc.).
- `engagement_result` — Sent when an engagement resolves (success/miss, effectiveness score).

**Track Data (Frontend):**
```typescript
interface TrackData {
  id: string;                      // BOGEY-1, JKIL-01, etc.
  dtid_phase: "detected" | "tracked" | "identified" | "defeated";
  affiliation: "friendly" | "hostile" | "unknown";
  x: number;                       // km from base center
  y: number;
  altitude_ft: number;
  speed_kts: number;
  heading_deg: number;
  confidence: number;              // 0-1
  classification: string | null;   // "commercial_quad", "passenger_aircraft", etc.
  trail: [number, number][];       // Past positions for trail line
  sensors_detecting: string[];     // Which sensors see this track
  neutralized: boolean;
  is_interceptor?: boolean;        // Jackal only
  interceptor_target?: string;     // Target track ID for Jackal
  intercept_phase?: string;        // "launch", "midcourse", "terminal"
  coasting?: boolean;
  hold_fire?: boolean;
  eta_protected?: number;          // Seconds until protected area
}
```

### Known Working Features
✅ Scenario select + loadout + placement + running mission
✅ Real-world maps (Leaflet satellite)
✅ Radar detection (TPQ-51, KURZ FCS)
✅ Track coasting (24s extrapolation)
✅ DTID kill chain (detect → track → identify → defeat)
✅ Camera slew (detected/tracked/identified phases)
✅ Thermal camera with 6 silhouettes
✅ JACKAL full lifecycle (launch, flight, intercept, miss, self-destruct)
✅ Camera explosion on intercept
✅ Jammer activation regardless of range (effect range-dependent)
✅ Ambient air traffic (commercial, military, birds, balloons)
✅ Continuous operations (waves, pauses, END MISSION button)
✅ Web Audio synthesis (10 sound effects)
✅ Hold Fire command
✅ Track alerts (blinking, alarms)
✅ Protected/Warning areas with ETA
✅ SHINOBI RF detection (multi-band, library-based)
✅ SHINOBI Protocol Manipulation (HOLD, LAND NOW, DEAFEN)
✅ SHINOBI CM state progression (pending → 1/2 → 2/2)
✅ SHINOBI track data (frequency band, uplink/downlink, CM state)
✅ SHINOBI range rings (purple, detect 8km / defeat 6km)
✅ SHINOBI Action Wheel submenu (CM type selection)
✅ SHINOBI combined system in equipment catalog (single placement → sensor + effector)
✅ SHINOBI in Loadout (Combined Systems section) and Placement (purple hexagon, dual rings)

### Known Issues / TODOs
- [ ] `EngagementPanel.tsx(107,28)`: pre-existing TS error `TS2722: Cannot invoke an object which is possibly 'undefined'` — does not affect runtime
- [ ] SHINOBI combined system changes are **uncommitted** (across ~14 files) — commit when ready
- [ ] Joint Data Network / SIAP integration (shared air picture, track correlation, Link-16 feeds)
- [ ] After-action replay (timeline scrub on debrief)
- [ ] Mobile-responsive layout for tablet demos
- [ ] Docker deployment + README polish
- [ ] Port all logic to client-side JS (zero-server deployment on here.now)
- [ ] Advanced scenario builder (player creates custom scenarios)
- [ ] Multi-operator / multiplayer support (share same mission)

### Quick Debug Commands
```bash
# Start dev stack
make dev                     # Backend + frontend
cd frontend && npm run dev   # Frontend only (if backend already running)
cd backend && source ../.venv/bin/activate && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Test WebSocket
python3 << 'EOF'
import asyncio, websockets, json
async def test():
    async with websockets.connect('ws://localhost:8000/ws/game') as ws:
        await ws.send(json.dumps({'scenario_id': 'lone_wolf', 'base_id': 'medium_airbase', 'placement': {...}}))
        for i in range(10):
            msg = json.loads(await ws.recv())
            print(f"Tick {i}: {msg['type']}")
asyncio.run(test())
EOF

# Check git history
git log --oneline -20
git diff HEAD~5..HEAD --stat  # Last 5 commits
```

### Next Session Roadmap (for you to pick from)

**High Impact:**
1. **JDN / SIAP Integration** — Simulate network of C2 nodes sharing air picture. Track correlation. Link-16 feeds.
2. **After-Action Replay** — Timeline scrub on debrief. Rewind/replay events.
3. **Multiplayer / Shared Mission** — Two operators on same mission (one radios, one engages).

**Polish:**
4. Mobile-responsive layout (tablets for field demos)
5. Advanced scenario builder (player creates custom missions)
6. Docker + production deployment

**Next-Level:**
7. Port to all-client-side JS (zero-server, deployable on here.now)
8. VR mode (with headset support)
9. Integration with real C2 systems (API bridge)

---

## How to Use This File
- **Before starting work:** Read the relevant section here first (e.g., "JACKAL Full Lifecycle" if you're fixing interceptor bugs)
- **When adding a feature:** Add it to "Known Working Features" ✅ when done
- **When finding a bug:** Reproduce it, add to "Known Issues" with a brief description
- **When changing architecture:** Update the "File Structure" or "Game Loop" section

Good luck! 🛡️
