# SKYSHIELD

**Free, browser-based C-UAS training simulator.** Practice the full DTID kill chain (Detect → Track → Identify → Defeat) in a realistic tactical operations center environment — no clearance required.

**Target user:** "The E-5 who gets handed the C-UAS binder and told to figure it out."

---

## Features

### Core Gameplay — DTID Kill Chain
- **Detect** — AN/TPQ-51 radar picks up contacts at 10km, KURZ FCS at 10km
- **Track** — Confirm contacts, watch trail history, monitor coasting tracks
- **Identify** — Slew EO/IR camera, visually ID drone silhouette (quad, fixed-wing, Shahed, bird, balloon)
- **Defeat** — Kinetic (JACKAL interceptor), EW (RF jammer), or SHINOBI protocol manipulation

### Equipment (Fictional but Spec-Accurate)
| System | Type | Range | Notes |
|--------|------|-------|-------|
| AN/TPQ-51 | Surveillance radar | 10km | 360°, all-weather |
| KURZ FCS | Fire control radar | 10km | Guides JACKAL intercepts |
| EO/IR Camera | Pan/tilt camera | 8km | Thermal + daylight, 1-8x zoom |
| RF/PNT Jammer | Electronic warfare | 3km | Passive area suppression once activated |
| JACKAL Pallet | Kinetic interceptor | 10km | 4 rounds, 10-15s spinup, KURZ-guided |
| SHINOBI | RF detect + defeat | 8km detect / 6km defeat | HOLD / LAND NOW / DEAFEN |

### Threat Types
- **Commercial Quad** — GPS/RF dependent, fully jammable
- **Fixed-Wing** — 40% jam resistance, faster
- **Micro UAS** — Small, hard to see on camera
- **Improvised** — Unknown electronics, 50% jam resistance
- **Shahed-style** — Autonomous INS navigation, **100% jam immune**
- **Bird / Weather Balloon / Passenger Aircraft / Military Jet** — Ambient traffic for ROE training

### UI/UX
- **Real-world satellite maps** via Leaflet.js + OpenStreetMap (any location)
- **FAAD C2 / Medusa-style interface** — Radial action wheel (WOD), track data blocks, range rings
- **EO/IR Camera panel** — Thermal/daylight modes, realistic silhouettes, heat shimmer
- **Track list** — Live contact feed in left sidebar (all contacts including ambient)
- **Event log** — Color-coded by severity, full engagement history
- **Debrief screen** — Per-category scoring across all waves

### Operational Features
- **JAM ALL** — Activates all jammers simultaneously
- **CLEAR AIRSPACE** — Removes ATC-clearable aircraft (jets/commercial), birds/balloons unaffected
- **Hold Fire** — ROE lockout on individual tracks
- **Continuous ops** — Wave-based, mission runs until player ends it
- **JACKAL spinup** — 10-15s warmup sequence before launch (realistic)
- **Passive area jamming** — Activated jammer auto-affects all targets in range each tick

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Install
```bash
make install
```

### Run
```bash
# Terminal 1
cd backend && python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173** and hit **QUICK START**.

---

## Architecture

```
backend/
  app/
    main.py          — FastAPI app, WebSocket game loop (10Hz)
    models.py        — DroneState, GameState, enums
    actions.py       — Player action handlers
    jamming.py       — EW jamming logic + jam resistance by drone type
    coyote.py        — JACKAL interceptor lifecycle (spinup/launch/midcourse/terminal)
    detection.py     — Sensor detection logic
    ninja.py         — SHINOBI protocol manipulation
    scenario.py      — Scenario loading
    waves.py         — Wave spawning
    drone.py         — Drone movement/behavior
  equipment/
    catalog.json     — Equipment definitions
  scenarios/
    lone_wolf.json   — Single drone
    swarm_attack.json — 5 drones + Shahed
    recon_probe.json — 3 drones with trigger discipline
    tutorial.json    — Guided walkthrough
  bases/
    small_fob.json / medium_airbase.json / large_installation.json

frontend/src/
  App.tsx            — State machine, WebSocket, phase transitions
  components/
    TacticalMap.tsx  — Leaflet map, track icons, range rings, WOD
    CameraPanel.tsx  — EO/IR canvas renderer (thermal + daylight)
    RadialActionWheel.tsx — Right-click action wheel
    HeaderBar.tsx    — Mission status, JAM ALL, CLEAR AIRSPACE
    TrackList.tsx    — Live contact list (left sidebar)
    EngagementPanel.tsx — DTID phase controls
    DebriefScreen.tsx — Post-mission scoring
```

---

## Roadmap (Phase 2)
- [ ] Base Defense Planner — drag/drop sensor placement pre-mission
- [ ] Coverage gap visualization (LOS shadows, uncovered sectors)
- [ ] Planning score in debrief (coverage completeness, effector positioning)
- [ ] Fix JAM ALL / CLEAR AIRSPACE visual feedback issues
- [ ] End-to-end smoke test pass before external beta

---

## License
MIT — free to use, modify, and distribute for training purposes.
