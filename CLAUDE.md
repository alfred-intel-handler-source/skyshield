# CLAUDE.md — SKYSHIELD Project Guide (Updated 2026-03-18)

## What Is This?
SKYSHIELD is a **free, browser-based C-UAS training simulator** designed to teach military operators the **DTID kill chain** (Detect → Track → Identify → Defeat). It's built to feel like a real FAAD C2 or Medusa workstation. No clearance required — purely training.

**Target User:** "The E-5 who gets handed the C-UAS binder and told to figure it out."

**Vision:** Deployable worldwide so any military member can train C-UAS operations without needing real systems at their base.

## Current State (69 commits, ~18,000+ lines)

### Equipment (Fictional Names, Accurate Specs)
| Fictional | Real Equivalent | Range | Notes |
|-----------|----------------|-------|-------|
| AN/TPQ-51 | AN/TPQ-50 | 10km | 360° surveillance radar |
| KURZ FCS | KURFS | 10km | Fire control, guides JACKAL |
| EO/IR Camera | Nighthawk | 8km | Pan/tilt, thermal + daylight |
| RF/PNT Jammer | Generic EW | 3km | Passive area suppression |
| JACKAL Pallet | Coyote Block 2C | 10km | 4 rounds, 10-15s spinup |
| SHINOBI | NINJA Gen2 | 8km/6km | RF detect + protocol manipulation |

### Drone Types
| Type | Jam Resistance | Notes |
|------|---------------|-------|
| commercial_quad | 0% | Fully jammable |
| micro | 10% | Small GPS receiver |
| fixed_wing | 40% | Basic autopilot |
| improvised | 50% | Unknown RF dependency |
| shahed | 100% | Autonomous INS, jam-immune |
| bird / weather_balloon | N/A | Ambient, ATC cannot clear |
| passenger_aircraft / military_jet | N/A | Ambient, ATC-clearable |

### Core Features ✅
- **DTID Kill Chain** — Full detect → track → identify → defeat flow
- **EO/IR Camera** — Thermal + daylight modes, silhouettes always drawn from `drone_type` (not classification), heat shimmer, realistic sky background with horizon
- **Radial Action Wheel** — Animated open/close, DTID phase color theming, track ID in hub, hover/disabled states
- **Tactical Map** — Leaflet.js + OpenStreetMap satellite, hostile pulse ring, bold range rings (no fill), JACKAL green triangle icon, JAM badge, track labels with phase color
- **Passive Area Jamming** — Jammer must be manually activated (device wheel), then auto-affects all targets in range each tick. No recharge — runs indefinitely.
- **JAM ALL button** — HeaderBar, activates all jammers simultaneously (amber button)
- **CLEAR AIRSPACE button** — HeaderBar, removes passenger/military aircraft, leaves birds/balloons (blue button). Suppresses new aircraft spawns for 120s.
- **JACKAL Spinup** — 10-15s warmup phase before launch, countdown shown on track label (amber "SPINUP T-Xs")
- **SHINOBI Protocol Manipulation** — HOLD / LAND NOW / DEAFEN via submenu
- **Track List** — Left sidebar below effectors, shows all contacts including ambient, clicking selects track
- **Continuous Wave Ops** — Mission runs until END MISSION, waves escalate

### Game Flow
1. **QUICK START** → straight to running (lone_wolf scenario, medium_airbase)
2. **CUSTOM** → Scenario Select → Loadout → Placement → Running → Debrief

### Known Issues / TODO
- **JAM ALL / CLEAR AIRSPACE visual feedback** — buttons may not visually confirm activation (backend logic is correct, may be state sync issue). Needs investigation.
- **Phase 2 features** (from NEXT-SESSION-PROMPT.md) — Base Defense Planner, full LOS coverage visualization, planning score in debrief — NOT YET BUILT
- **Git author identity** — commits showing automated email, set with `git config --global user.name/email`

## Tech Stack
- **Backend:** FastAPI (Python 3.13), WebSocket at 10Hz tick rate
- **Frontend:** React 19, TypeScript, Vite, Leaflet.js, HTML5 Canvas
- **Maps:** OpenStreetMap satellite + CartoDB Dark Matter tiles (free)
- **Data:** JSON scenarios + base templates + equipment catalog

## Key File Structure

**Backend:**
- `app/main.py` — FastAPI app, WebSocket game loop, all action routing
- `app/models.py` — DroneState, GameState, all enums (DroneType, DTIDPhase, etc.)
- `app/actions.py` — All player action handlers (confirm, identify, engage, jam_all, clear_airspace, jammer_toggle, etc.)
- `app/jamming.py` — EW logic, `JAM_RESIST` dict per drone type, `update_jammed_drone()`
- `app/coyote.py` — JACKAL lifecycle: spinup → launch → midcourse → terminal → intercept/self-destruct
- `app/ninja.py` — SHINOBI protocol manipulation state machine
- `equipment/catalog.json` — All equipment definitions with ranges
- `scenarios/*.json` — Scenario files (lone_wolf, swarm_attack, recon_probe, tutorial)

**Frontend:**
- `App.tsx` — State machine, WebSocket, all handlers, phase transitions
- `components/TacticalMap.tsx` — Leaflet map, all track/device icons, range rings, WOD trigger
- `components/CameraPanel.tsx` — Canvas EO/IR renderer, silhouettes, thermal mode, noise
- `components/RadialActionWheel.tsx` — Right-click pie menu for tracks
- `components/DeviceWheel.tsx` — Right-click menu for sensors/effectors (jammer activate/deactivate here)
- `components/HeaderBar.tsx` — Mission clock, threat level, JAM ALL, CLEAR AIRSPACE, END MISSION
- `components/TrackList.tsx` — Live contact list (left sidebar)
- `components/EngagementPanel.tsx` — DTID phase UI buttons
- `types.ts` — All TypeScript interfaces (TrackData includes drone_type, spinup_remaining, jammer_active)

## Valid Action Names (backend VALID_ACTION_NAMES)
`confirm_track`, `identify`, `engage`, `hold_fire`, `release_hold_fire`, `end_mission`, `slew_camera`, `shinobi_hold`, `shinobi_land_now`, `shinobi_deafen`, `jammer_toggle`, `jam_all`, `clear_airspace`

## Dev Server Notes
- Backend: `cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev` (must land on port 5173 for proxy to work)
- **If frontend starts on 5174/5175**: kill all vite processes (`pkill -f vite`) and restart
- Quick Start URL: `http://localhost:5173`

## Next Session — Priority Work
1. **Fix JAM ALL / CLEAR AIRSPACE feedback** — Investigate why visual state doesn't confirm (event log shows events, so backend works; may be jammer_active not rendering on effector icon, or CLEAR AIRSPACE aircraft not being removed visually)
2. **Phase 2: Base Defense Planner** — See NEXT-SESSION-PROMPT.md for full spec
3. **Smoke test pass** — Run all 4 scenarios end-to-end before external beta
4. **Git identity fix** — `git config --global user.name "Jeremy Delvaux"` + email
