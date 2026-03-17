# SHINOBI → SKYSHIELD Concept Mapping

## Overview
This document maps SHINOBI system concepts to existing SKYSHIELD architecture, identifying what's already built and what needs enhancement.

---

## 1. DETECTION & TRACK LIFECYCLE

### SKYSHIELD Current State
- ✅ **Radar Detection** (AN/TPQ-51, KURZ FCS)
- ✅ **Multi-sensor fusion** (different sensors report tracks)
- ✅ **Track coasting** (24s extrapolation when not detected)
- ✅ **DTID phase tracking** (detected → tracked → identified → defeated)
- ✅ **Track trails** (path history visualization)

### SHINOBI Additions Needed
- **Frequency band property** on tracks (currently not tracked)
- **Uplink vs Downlink detection distinction** (currently binary detect/not-detect)
- **RSSI & SNR metrics** (currently just confidence 0-1)
- **Multi-signal correlation** (same track may have multiple RF signals)
- **Library-based signal matching** (recognize specific sUAS models by signal fingerprint)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| `TrackData.confidence` | Signal detection confidence | ✅ Exists (0-1 scale) |
| `TrackData.altitude_ft` | Altitude from radar | ✅ Exists |
| `TrackData.dtid_phase` | Track state machine | ✅ Exists (detect→track→identify→defeat) |
| `TrackData.trail` | Position history | ✅ Exists |
| (missing) | `frequency_bands[]` | ❌ Add |
| (missing) | `uplink_detected` | ❌ Add |
| (missing) | `downlink_detected` | ❌ Add |
| (missing) | `rssi_dbm` | ❌ Add |
| (missing) | `snr_db` | ❌ Add |
| (missing) | `signals[]` array | ❌ Add (per-sensor signal detail) |

---

## 2. AFFILIATION SYSTEM

### SKYSHIELD Current State
- ✅ **Binary affiliation** (friendly vs hostile ROE check)
- ✅ **ROE logic** (engage only red/hostile)
- ✅ **Ambiguous tracks** (some aircraft are neutral/civilian)

### SHINOBI Additions Needed
- **NATO force color model** (Blue/Green/Yellow/Red with specific semantics)
- **Affiliation persistence** (assign and save to registry)
- **Multi-operator affiliation sync** (mesh network auto-accept)
- **Unresolved assignment indicator** (visual flag when affiliation ambiguous)
- **Ignore flag** (suppress from display but keep logged)
- **Custom tagging** (user-defined labels per track)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| `TrackData.affiliation` | Friendly/Hostile enum | ✅ Exists (but binary) |
| `ROE check` | Engagement authorization | ✅ Exists |
| (missing) | `color: "blue"/"green"/"yellow"/"red"` | ❌ Expand enum |
| (missing) | `affiliation_registry{}` | ❌ Add |
| (missing) | `ignore_flag` | ❌ Add |
| (missing) | `custom_tags[]` | ❌ Add |
| (missing) | `pinned_state` | ❌ Add |

---

## 3. COUNTERMEASURES (DEFEAT)

### SKYSHIELD Current State
- ✅ **JACKAL interceptor** (kinetic defeat)
- ✅ **RF Jammer** (EW defeat)
- ✅ **Hold Fire command** (engagement lockout)
- ✅ **Multiple simultaneous JACKAL engagements** (2 pallets = 4 Jackals)

### SHINOBI Additions Needed
- **Alternative countermeasure types** (Hold, Land Now, Reroute, Drop, Rebind)
- **Countermeasure state tracking** (1/2 vs 2/2: downlink-only vs uplink-active)
- **Link-type dependent CM selection** (what CMs work for each signal type)
- **TX ID field** (for Rebind command)
- **Safe zone selection** (Reroute targets)
- **Multi-hub employment** (mesh network chooses which system executes)
- **Auto-pin on countermeasure** (track stays in focus while CM active)
- **Auto-removal after stale** (5-minute timeout)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| `JACKAL` interceptor | Kinetic defeat | ✅ Exists (missiles) |
| `RF Jammer` | EW defeat | ✅ Exists (jamming) |
| `HOLD FIRE` | Engagement lockout | ✅ Exists |
| (missing) | `Hold` command | ❌ Add (software/link-based) |
| (missing) | `Land Now` | ❌ Add (graceful descent) |
| (missing) | `Reroute` | ❌ Add (divert to safe zone) |
| (missing) | `Drop` | ❌ Add (jettison payload) |
| (missing) | `Rebind` | ❌ Add (hijack controller) |
| (missing) | `cm_state: "1/2" or "2/2"` | ❌ Add |
| (missing) | `active_cm_expires_at` | ❌ Add (5-min timeout) |
| (missing) | `tx_id` | ❌ Add (for Rebind) |

---

## 4. DASHBOARD & UI PATTERNS

### SKYSHIELD Current State
- ✅ **Leaflet.js map** (geospatial rendering)
- ✅ **Track data blocks** (Hook Bubbles with key info)
- ✅ **Right-click Radial Action Wheel** (Wheel of Death)
- ✅ **Device WOD** (sensor/effector actions)
- ✅ **Range ring visualization** (coverage zones, color-coded)
- ✅ **Track coasting visual** (faded icons)
- ✅ **Hold Fire dashed box** (engagement lockout indicator)
- ✅ **Protected/Warning areas** (geometries with ETA countdown)
- ✅ **Track alerts** (blinking, banners, escalating alarms)

### SHINOBI Additions Needed
- **Feed panel** (right sidebar with live track list)
- **Track card layout** (visual cards vs table, with expand/collapse)
- **Pinned tracks section** (top of feed, auto-pinned during countermeasure)
- **Ghost Detect feature** (manually log visually-observed sUAS with no RF)
- **Affiliation assignment UI** (force color picker)
- **Geolocation table** (signal source, frequency, RSSI, SNR per detection)
- **Navigation panel icons** (left sidebar: Map, Events, Hubs, Registry, Products, Settings)
- **Supervisor control panel** (show/hide specific countermeasures per local SOP)
- **Dictionary viewer** (definitions of commands, platforms, signals)
- **Map layer manager** (satellite, vector, overlays, geometries)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| `TacticalMap.tsx` | Map rendering | ✅ Exists (Leaflet) |
| `EngagementPanel.tsx` | Track action workflow | ✅ Exists (DTID panel) |
| `RadialActionWheel.tsx` | Right-click menu | ✅ Exists |
| `Range rings` | Coverage visualization | ✅ Exists |
| (missing) | `FeedPanel.tsx` | ❌ Add (right sidebar track list) |
| (missing) | `TrackCardLayout.tsx` | ❌ Add (card vs table toggle) |
| (missing) | `AffiliationRegistry.tsx` | ❌ Add (force color manager) |
| (missing) | `GeolocationTable.tsx` | ❌ Add (signal detail table) |
| (missing) | `NavigationPanel.tsx` | ❌ Refactor (icons + pages) |
| (missing) | `SupervisorSettings.tsx` | ❌ Add (CM visibility controls) |
| (missing) | `Dictionary.tsx` | ❌ Add (hover definitions) |

---

## 5. SYSTEM MANAGEMENT (SDR Platform Manager)

### SKYSHIELD Current State
- ❌ No SDR Platform Manager equivalent
- ❌ No web-based system management UI
- ❌ No user role management (Supervisor/Operator/Viewer)
- ❌ No hardware configuration panel

### SHINOBI Additions Needed
- **Platform Manager web UI** (at management IP)
- **User management** (create/assign roles)
- **Power options** (reboot, shutdown)
- **Hardware tests** (Built-in Test / BIT)
- **Cluster management** (mesh network display)
- **Network settings** (IP address, interfaces)
- **Storage management** (export, backup)
- **System metrics** (CPU, memory, RF status)
- **Software updates** (package upload, installation)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| (none) | `SDRPlatformManager` | ❌ Not applicable to simulator (no hardware) |

**Note**: SKYSHIELD is a training simulator without physical hardware. SDR Platform Manager concepts (BIT, hardware tests, RF amplifier diagnostics) are not relevant. Focus instead on mission control panel concepts (user management, scenario configuration).

---

## 6. TRACK SIGNAL TYPES & LINK ANALYSIS

### SKYSHIELD Current State
- ✅ **Drone behavior model** (direct approach, orbit, evasive, etc.)
- ✅ **Effector engagement** (Jackal, Jammer)
- ✅ **Ambient air traffic** (commercial, military, birds, balloons)

### SHINOBI Additions Needed
- **DJI product recognition** (Phantom, Mavic, Air, Mini variants)
- **Lightbridge link model** (2-way, 2.4GHz + 5.8GHz simultaneous)
- **RMILEC link model** (tactical, encrypted, frequency-hopping resistant)
- **Downlink-only classification** (e.g., geolocation transmitter with no uplink)
- **Multi-frequency simultaneous** (same drone on 2.4GHz and 5.8GHz)
- **Signal library** (what Shinobi can detect vs doesn't know)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| Drone types (generic) | Specific sUAS models | ⚠️ Partial (hardcoded drones) |
| Drone behaviors | Lightbridge/RMILEC behavior | ⚠️ Partial (generic flight model) |
| Jammer effect | Multi-frequency jamming | ⚠️ Partial (omnidirectional effect) |
| (missing) | DJI product library | ❌ Add (Phantom, Mavic, etc.) |
| (missing) | Link-type specific behaviors | ❌ Add |
| (missing) | Uplink/downlink distinction | ❌ Add |

---

## 7. OPERATIONAL PROCEDURES (SPINS & ENGAGEMENT RULES)

### SKYSHIELD Current State
- ✅ **ROE enforcement** (don't shoot friendlies)
- ✅ **ROE violations tracked** (scoring penalty)
- ✅ **Debrief scoring** (DTID accuracy, reaction time, effectiveness)
- ✅ **Continuous operations** (waves, escalating difficulty)

### SHINOBI Additions Needed
- **SPINS briefing display** (pre-mission: local SOPs, TTPs, ROEs, SPINS)
- **Fingerprint warning** (alert on countermeasure use: leaves traces)
- **Force custody reminder** (ensure U.S. forces have sUAS before pilot retrieves)
- **DTRA reporting** (log countermeasure employment for analysis)
- **OPSEC indicators** (passive vs active, internet isolation reminder)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| ROE checks | Engagement authorization | ✅ Exists |
| Scoring system | Mission effectiveness | ✅ Exists (DTID accuracy) |
| (missing) | `SPINS briefing panel` | ❌ Add (pre-mission) |
| (missing) | `Fingerprint warning` | ❌ Add (on countermeasure) |
| (missing) | `DTRA logging` | ❌ Add (mission export) |

---

## 8. EMULATOR SYSTEM CONCEPTS

### SKYSHIELD Current State
- ✅ **Training missions** (pre-set scenarios)
- ✅ **Environmental randomization** (wind, weather effects)
- ❌ **Library Test feature** (transmit pre-recorded signals for validation)
- ❌ **Detect and Counter (D&C)** (ES transmits, operator responds with countermeasure)

### SHINOBI Additions Needed
- **Library Test mode** (replay canned signals for operator training)
- **D&C scenario type** (bidirectional: operator detects and counters)
- **Environmental Scan reporting** (RF noise baseline)

### Mapping
| SKYSHIELD | SHINOBI Concept | Status |
|-----------|---------------|--------|
| Scenario types | Tutorial, Training, Operational | ✅ Exists |
| (missing) | `Library Test` scenario | ❌ Add (canned signal replay) |
| (missing) | `Detect and Counter` scenario | ❌ Add (bidirectional exchange) |

---

## INTEGRATION PRIORITY

### Phase 1: Core Enhancement (High Impact)
1. Add frequency bands to track model
2. Add uplink/downlink detection distinction
3. Add RSSI/SNR metrics
4. Implement NATO affiliation colors (Blue/Green/Yellow/Red)
5. Create Feed Panel with track cards
6. Add countermeasure state (1/2 vs 2/2)

### Phase 2: UI Polish (Medium Impact)
1. Affiliation Registry page
2. Geolocation signal table
3. Navigation panel refactor
4. Supervisor settings panel
5. Dictionary viewer
6. Map layer manager

### Phase 3: Advanced Features (Lower Priority, Training Value)
1. Safe zone geometry system (Reroute support)
2. Library Test scenario mode
3. Detect and Counter scenario mode
4. SPINS/OPSEC briefing panel
5. DTRA mission export
6. Mesh network hub selector (for multi-system deployments)

---

## File References

- **Full Technical Details**: `/sessions/gallant-awesome-hamilton/mnt/skyshield/NINJA_INTEGRATION_TECHNICAL_SUMMARY.md`
- **Quick Reference**: `/sessions/gallant-awesome-hamilton/mnt/skyshield/NINJA_QUICK_REFERENCE.md`
- **SKYSHIELD Architecture**: `/sessions/gallant-awesome-hamilton/mnt/skyshield/CLAUDE.md`

---

**Last Updated**: March 17, 2026
