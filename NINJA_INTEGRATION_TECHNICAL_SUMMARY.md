# SHINOBI C-UAS System — Technical Integration Guide for SKYSHIELD
## Key Technical Details for Training Simulator Integration
### Document Date: March 17, 2026 | Based on Shinobi Training Slides V1.11 (Sept 2024)

---

## 1. SHINOBI DETECTION & RF CAPABILITIES

### Supported Frequency Bands (Multi-Band Detection)
- **2.4 GHz**: DJI Phantom series (downlink), generic Wi-Fi
- **5.8 GHz**: DJI Phantom series (uplink), high-bandwidth links
- **430 MHz**: RC control links (narrow-band)
- **900 MHz**: Extended range tactical links (SiK, autonomous systems)

**Library-Based Detection Model**: Shinobi only detects signals **in its software library**. The system is upgradeable with new signal libraries as emerging threats appear.

### Detection Architecture
- **Multi-Sensor Fusion**: Multiple detection systems (Gen2, TRx, Dismount) can feed geolocation data
- **Downlink + Uplink Detection**:
  - Downlink detection = video/telemetry from drone to controller
  - Uplink detection = commands from controller to drone
  - Countermeasure effectiveness varies by detection type
- **RSSI & SNR Metrics**: Each signal detection includes:
  - **RSSI** (Receive Signal Strength Indicator)
  - **SNR** (Signal-to-Noise Ratio)
  - Geolocation data (if available from downlink)

### Range & Distance Limitations
- **Library Test Feature**: Functional at **400m from Gen2 mast** (validation range)
- **RC Detect/Counters**: Tested at **235m from Gen2 mast** (reduced range for narrow-band)
- **RMILEC Minimum Distance**: >70m from Gen2 mast (to avoid self-interference)
- **Detection and Counter (D&C)**: Minimum 50m from Gen2 mast for RMILEC signals

---

## 2. SHINOBI COUNTERMEASURES (DEFEAT METHODS)

### Available Countermeasure Types
Countermeasures are **only presented for Red, Green, and Yellow affiliated tracks** (not Blue/unknown).

#### A. Lightbridge-Specific Countermeasures
1. **HOLD** — Pauses vehicle, stops accepting new commands
2. **LAND NOW** — Forces immediate landing (graceful descent)
3. **LAND NOW (BDA)** — Battle Damage Assessment version (alternative landing method)
4. **REROUTE** — Diverts to pre-programmed safe zone (default or custom)
5. **REROUTE (BDA)** — Alternative reroute method
6. **REBIND** — Attempts to rebind controller to spoofed uplink
   - Requires **Transmitter ID (TX ID)** to execute
   - Only available if operator has access to applicable controller

#### B. Multi-Platform Countermeasures
- **DROP** — Forces payload/battery drop (for drone-based cargo)
- **DROP (BDA)** — Alternative drop method
- **DEAFEN** — Countermeasure for OcuSync Link Technologies

#### C. Gen2 Multiband Defeat Capability
- Single Gen2 can perform **simultaneous countermeasures** on different platforms:
  - Example: Two Lightbridge drones (one on 2.4GHz, one on 5.8GHz) can be engaged at the same time
  - Countermeasures automatically unavailable if simultaneous engagement not possible

#### D. TRx (Transceiver Extender) Limitations
- TRx targets **one drone at a time**
- Can detect/counter: RMILEC, Dragonlink, SiK, Digi, Futaba, Microhard, Spektrum, FrSky
- **DEAFEN** now available for OcuSync

### Countermeasure States
- **1/2 State**: Downlink-only detection (countermeasure not in effect, signal is one-way)
- **2/2 State**: Uplink detected, countermeasure fully active (bidirectional link established)
- **Active (Green)**: Actively transmitting
- **Stale Removal**: Countermeasures auto-remove after 5 minutes if track becomes stale

### Mesh Network Multi-Hub Employment
- Multiple Shinobi systems in a **meshed network** can offer the same countermeasure from different hubs
- User selects which system (hub) executes the countermeasure
- For REROUTE: User can select default safe zone or alternative custom zone for each system

---

## 3. DASHBOARD UI LAYOUT & INTERACTION PATTERNS

### Main Screen Sections

#### Navigation Panel (Left Sidebar)
- **Map**: Opens Map Toolbar with geospatial tools
- **Events**: Event log/alert panel
- **Hubs**: System status and track archive
- **Target Registry (Affiliation)**: Assign NATO force colors to tracks
- **Products**: Access log files, reports, exports
- **Settings**: UI theming, supervisor controls

#### Feed Panel (Right Sidebar)
- **Live track list** showing all detected RF signals
- **Pinned Tracks Section**: Countermeasures auto-pin tracks; manual pinning available
- **Status indicators**: Green flashing circle when receiving track data (not just connection)
- **System faults**: Displayed in feed
- **Connection status**: Orange rotating circle (connecting), orange turtle (slow/unresponsive)

#### Main Panel (Center)
- **Map display** with track symbols (colored by affiliation)
- **Map Toolbar** above map with tools:
  - Maps & Overlays (satellite, vector tiles, custom overlays)
  - System Locations (sensor placement, coverage rings)
  - Range Rings (color-coded per system with labels)
  - History & Predictions (trail lines, predicted positions)
  - Measure Tool (distance/bearing)
  - Geometries: Circles, Polygons, Points (safe zones, tripwires, AOI)

### Track Display & Selection
- **Card Layout** or **Legacy Table Layout** for track listing
- **Track Icons**: Color-coded by affiliation
  - Blue = Friendly (no countermeasures)
  - Green = Friend/Neutral (countermeasures available)
  - Yellow = Uncertain (countermeasures available)
  - Red = Hostile (countermeasures available)
- **Clicking track**: Highlights on map, opens Track Details Dialog
- **Watch/Ignore Flags**: Suppress tracks from display (grey slashes through card)

### Track Details Dialog Components
1. **Platform Details Section**
   - Picture (if available from library)
   - Name, Type, Weight, Size
   - Frequency bands active
   - Control range specs

2. **Entities Section**
   - Aircraft (drone) entity
   - Controller (radio/remote) entity
   - Return-to-Launch (RTL) location

3. **Signals Section** (Table)
   - Detecting system name
   - Emitter type
   - Detection timestamp
   - Frequency
   - RSSI value
   - SNR value

4. **Geolocation Data Section**
   - Only available if downlink decoded
   - Refresh time indicators
   - Map icons for controller location

5. **Countermeasures Section**
   - Available buttons for applicable countermeasures
   - Hub selector dropdown
   - Safe zone selector (for REROUTE)
   - Status indicators (1/2 vs 2/2)

6. **Comments Section**
   - User-added operational notes
   - Comments from other mesh network users

### Feed Panel Filtering & Sorting
- **Sort Options**:
  - By ID
  - By Start Time
  - By Segment Start Time
  - By Date
- **Filters**: Track type, affiliation, frequency band
- **Ghost Detect**: Manually log visually-observed sUAS with no RF signal detection

---

## 4. TRACK LIFECYCLE & CLASSIFICATION

### Track Data Elements
Each track in the feed contains:
- **Track ID** (auto-generated, e.g., "UKN-1", "DJI-2")
- **Display Name** (e.g., "DJI Phantom 4")
- **Type/Classification** (if library-matched)
- **Frequency Bands**: Primary and secondary bands
- **TX ID** (Transmitter ID, encoded in signal)
- **Confidence Level**: Detection confidence (0-100%)
- **Affiliation**: Blue/Green/Yellow/Red (forced unknown by default)
- **Last Detected**: Timestamp of most recent signal
- **Stale Timeout**: 5 minutes default (configurable per installation)

### Platform Recognition
Shinobi recognizes specific sUAS platforms via signal library:
- **DJI Products**: Phantom, Mavic, Air, Mini series
- **Civilian/Commercial**: DJI, Autel, Yuneec, Parrot, etc.
- **Tactical/Military**: Dragonlink, Lightbridge, SiK, FrSky
- **Range Extenders**: Digi Maxstream Xtend, mesh relays
- **Control Types**: Lightbridge 2-way, Phantom 1-way, RMILEC bidirectional

### Affiliation Assignment Methods
1. **Automatic**: By Track Details Dialog dropdown
2. **Manual**: Via Target Registry page (force color assignment)
3. **Permanent Export**: Registry saved as JSON file (with affiliation, tags, ignore flags)
4. **Meshed Network**: Auto-acceptance of affiliation assignments from other networked Shinobi systems

### Designation/Tagging System
- **Custom Tags**: User-assigned identifiers
- **Watch Flag**: Include in display
- **Ignore Flag**: Grey out in feed (remains logged)
- **Pin to Top**: Manually keep in "Pinned Tracks" section

---

## 5. SDR PLATFORM MANAGER (System Control Interface)

### Access & Authentication
- **URL**: https://192.168.5.81/platform (Gen2), https://192.168.5.30/platform (Emulator System)
- **Authentication**: Shinobi user credentials required
- **Role-Based Access**:
  - **Supervisor**: Full access to Platform Manager & Dashboard
  - **Operator**: No Platform Manager access, operational access only to Dashboard
  - **Viewer**: No Platform Manager access, Dashboard view-only mode

### User Management Panel
- Create/delete user accounts
- Assign roles (Supervisor/Operator/Viewer)
- Activate/deactivate users
- Track active users (currently logged in)

### Key Management Functions
1. **Power Options**: Shutdown, reboot, sleep
2. **Application Settings**:
   - Three (3) software upload methods (web UI, USB, direct file)
   - Software version management
3. **Hardware Tests Panel**:
   - Built-in Test (BIT) execution
   - System health diagnostics
4. **Cluster Members Panel**:
   - Display of networked Shinobi systems
   - Mesh network topology
5. **Network Settings Panel**:
   - IP address configuration
   - Network interface management
6. **Storage Panel**:
   - Data export/backup
   - Report generation
7. **System Metrics Panel**:
   - CPU, memory, RF component status
   - System health reports
8. **Hardware Configuration Panel**:
   - RF module assignments
   - Antenna configuration
9. **Network Health Panel**:
   - Network connectivity tests
   - Performance metrics

### Software Update Mechanism
- **Upgradeable Library**: New sUAS signal libraries distributed as .pkg.tar.gz packages
- **Installation Process**:
  1. Upload .pkg file via Platform Manager
  2. Verify package appears under "Shinobi Packages"
  3. Select package and click OK to install
  4. System prompts for reboot
  5. Installation continues 4-5 minutes post-reboot
  6. Final reboot to complete

---

## 6. SHINOBI EMULATOR SYSTEM (ES) — VALIDATION & TESTING

### Purpose & Role
The Shinobi Emulator System is used for:
- **System Validation**: Verify Shinobi installation and functionality
- **Software Testing**: Validate signal libraries after software updates
- **Operator Training**: Validate if operators understand detect/counter procedures
- **Environmental Assessment**: Quick RF noise scan of frequency bands

### Hardware Assembly & Specs
- **IP Address**: 192.168.5.30
- **Default Login Key**: 135022
- **Frequency Bands**: Same as Gen2 (2.4GHz, 5.8GHz, 430MHz, 900MHz)
- **Startup Time**: Few minutes to load Docker containers and get GPS lock
- **Encryption**: SD card-based encryption/unlock (NOT interchangeable between ES units)

**Critical Assembly Notes**:
- **Antennas must be attached BEFORE power-on** (failure damages RF amplifiers)
- Antennas required: Tx, Rx, 400/900MHz, GPS
- Batteries sleep after 2 weeks (require charger wake-up)

### Feature Set: Library Test
- **Transmit-only feature**
- Pre-recorded signal simulations from sUAS library
- High power level (functional test, not sensitivity test)
- Signal types available:
  - DJI Enhanced Wi-Fi, 2.4GHz Wi-Fi, 5.2GHz Wi-Fi, 5.8GHz Wi-Fi
  - 400MHz SiK, 900MHz SiK
  - Dragonlink, Spektrum DSM, Futaba
  - Microhard, Yuneec Typhoon, Autel Evo
  - Lightbridge (2.4GHz & 5.8GHz variants)

### Feature Set: Detect and Counter (D&C)
- **Transmit and Receive function**
- Progressive power level transmission (increasing until detection)
- ES transmits test signal; Gen2 detects and sends countermeasure back
- TX ID encoding:
  - LB = Lightbridge variant
  - P# = Phantom # (P3, P4, etc.)
  - PR = PRO variant
  - 24 = 2.4GHz band transmission
  - 58 = 5.8GHz band transmission
- Minimum distance: 50m from Gen2 mast (RMILEC only)
- User selects track in Gen2 Feed Panel; initiates countermeasure response
- Useful for validating operator proficiency in detect/counter workflows

### Feature Set: Environmental Scan
- Quick assessment of RF noise across frequency bands
- User selects start frequency; scans 100MHz range
- Steps up every 2MHz (50 steps/100MHz span)
- Five passes recorded per scan
- Results accessible via SDR Platform Manager (https://192.168.5.30/platform)
- Four view modes:
  - **NORMAL**: 3-to-1 grouping (entire spectrum on screen)
  - **EXPANDED**: Left-right scrollable per 2MHz step
  - **MEAN**: Average of five scan passes
  - **MAX**: Peak power at each frequency step

### Reporting & Data Export
- **Manual Save Required**: Must save results before power cycle (auto-delete otherwise)
- Save location: Utilities → Data Management → Test Results → Save Current Results
- **Export Directory**: Via Platform Manager Storage → App folder
- **Exported Files**:
  - Test Results (timestamped log files)
  - Scans (tar files per scan with data + mean/max tables)
  - Run Logs (debug logs for troubleshooting)
- **Access**: Connect ES via Ethernet to Shinobi laptop, access https://192.168.5.30/platform

### Capabilities Matrix
ES 1.10.0 tested at:
- ✓ All general detection at 400m from Gen2 mast
- ✓ RC detect/counters at 235m from mast
- ✓ RMILEC minimum 70m+ from mast

---

## 7. TRACK SIGNAL TERMINOLOGY & LINK TYPES

### Downlink (Drone → Controller)
- **Definition**: Video/telemetry transmission from drone to controller/ground station
- **Characteristics**: One-way, contains geo/altitude/status data
- **Countermeasure Effect**: Reduces pilot situational awareness
- **System**: Often DJI downlink, Lightbridge video feed

### Uplink (Controller → Drone)
- **Definition**: Command/control transmission from operator to drone
- **Characteristics**: Two-way control channel
- **Countermeasure Effect**: Breaks vehicle control, may trigger RTH or failsafe
- **System**: Phantom control link, Lightbridge command, RMILEC tactical links

### Bi-Directional Link
- Both uplink and downlink present
- Full duplex communication
- Countermeasure effect: Complete control loss + navigation loss

### Return-to-Launch (RTL)
- Pre-programmed home point (controller location at launch)
- Engaged when uplink lost OR operator activates RTH
- Shinobi jamming can force uncontrolled RTH vs graceful landing

### OcuSync (DJI-Specific)
- Proprietary DJI 2.4/5.8GHz protocol for Phantom/Mavic/Air
- Advanced frequency hopping resistance
- **DEAFEN** countermeasure targets OcuSync specifically

### Lightbridge
- 2-way digital link for Phantom 4, Industrial platforms
- Operates on 2.4GHz and 5.8GHz (can split across bands)
- Supports video, telemetry, extended range
- All Lightbridge countermeasures available

### RMILEC (Robust Military-Grade Link)
- Tactical, encrypted control link
- Frequency hopping / spread spectrum resistance
- 70m+ minimum distance from detection system mast
- Used on military and high-end autonomous platforms

### Dragonlink, SiK, Digi, Spektrum, FrSky
- Open-source / civilian RC protocol standards
- Lower frequency (900MHz/430MHz common)
- Extended range hobby systems
- Detection/counter available on Gen2 and TRx

---

## 8. OPERATIONAL PROCEDURES & ENGAGEMENT RULES (SPINS)

### Pre-Engagement Requirements
**Operators must adhere to:**
1. **Local SOPs** (Standard Operating Procedures) per installation
2. **TTPs** (Tactics, Techniques, and Procedures) per command
3. **ROEs** (Rules of Engagement) per theater/mission
4. **Commander's Guidance** and SPINS
5. **JAG/Legal Briefings** (force protection, collateral damage, etc.)

### Countermeasure Decision Tree
- **Passive Detect/Track**: No signatures left on captured drone
- **Active Countermeasure**: Leaves "fingerprints" in sUAS internal flight logs
- **Critical**: U.S. Forces must have custody of sUAS **before pilot retrieves it** (to prevent return to enemy)

### OPSEC Concerns: "Shinobi Fingerprints"
**What are Shinobi Fingerprints?**
- Spoofed uplink commands logged in sUAS flight logs
- Abnormal command patterns detectable via forensic analysis
- Manufacturer (DJI/others) or adversary could potentially decode capability

**Risk Mitigation**:
- Do NOT allow countered sUAS to connect to internet post-engagement
- Follow DoD guidelines for sUAS handling/quarantine
- Consider forensic exploitation labs for captured systems
- Passive detect/track leaves NO fingerprints

**Secondary Concerns** (all subordinate to force protection):
- Adversary forensic analysis of captured sUAS
- Manufacturer investigation capability
- Proof of Shinobi capability could trigger counter-EW development

### DTRA Analysis & Reporting
- **Submission**: Shinobi log files uploaded to IntelDocs "Shinobi Force Protection Reporting" page
- **URL**: https://inteldocs.intelink.gov/folders/list/C2A037BB-6254-4003-9571-8FDCB04FDF9A
- **Access**: CAC/PIV certificate authentication
- **Files**: Export from Products page → transfer via USB to NIPR/SIPR computer → upload to IntelDocs
- **Classification**: UNCLASSIFIED/FOUO (CUI option not yet available in system)

---

## 9. INTEGRATION RECOMMENDATIONS FOR SKYSHIELD

### Track Model Enhancements
1. **Frequency Band Property**: Add to track data (2.4GHz, 5.8GHz, 430MHz, 900MHz)
2. **Uplink/Downlink Detection State**: Track whether uplink, downlink, or both detected
3. **Signal Quality Metrics**: Include RSSI and SNR in track object
4. **Countermeasure State Tracking**: 1/2 vs 2/2 status, active vs inactive

### Countermeasure Workflow
1. **Enable multi-countermeasure queuing** (Lightbridge HOLD + REROUTE simultaneously)
2. **Implement safe zone geometry system** (circles, polygons for protected areas/reroute destinations)
3. **Add TX ID display & entry** for Lightbridge-specific operations
4. **BDA (Battle Damage Assessment) variants** for secondary countermeasure methods

### UI/Dashboard Features to Mirror
1. **Mesh Network Hub Selector**: If multiple effectors present, show which one executes countermeasure
2. **Affiliation Management Tab**: Implement NATO force color assignment (Blue/Green/Yellow/Red)
3. **Geolocation Table**: Display signal detection source, frequency, RSSI, SNR per track entity
4. **Pin/Ignore/Tag System**: Track management in feed panel
5. **Range Ring Visualization**: Color-coded coverage zones per sensor
6. **Geometry Engine**: Safe zone circles, tripwire polygons, AOI marks

### Emulator Integration
1. **Training Mode**: Library test feature (transmit pre-recorded signals for operator training)
2. **D&C Validation**: Detect and counter feature to verify operator proficiency
3. **Environmental Scan Reporting**: RF noise assessment (not critical for tactical simulator)

### OPSEC/Engagement Rules Display
1. **Pre-Mission Briefing Panel**: Display local SOPs, TTPs, ROEs, SPINS
2. **Fingerprint Warning**: Alert operators when activating countermeasures (passive vs active distinction)
3. **Force Custody Requirement**: Reminder that countered drones must not escape custody
4. **DTRA Reporting Integration**: Log countermeasure employment for after-action analysis

---

## 10. KEY TECHNICAL SPECIFICATIONS SUMMARY

| Parameter | Value/Note |
|-----------|-----------|
| **Frequency Bands** | 2.4GHz, 5.8GHz, 430MHz, 900MHz (library-based) |
| **Detection Range** | 400m nominal (Gen2), varies by signal type |
| **Uplink Minimum Distance** | 50m (RMILEC), 235m (RC), 400m (general) |
| **Countermeasure Types** | Hold, Land Now, Reroute, Drop, Rebind, Deafen |
| **Affiliation Model** | NATO colors: Blue (friendly), Green/Yellow (neutral), Red (hostile) |
| **Countermeasure States** | 1/2 (downlink only), 2/2 (uplink active) |
| **Track Stale Timeout** | 5 minutes default |
| **Countermeasure Auto-Removal** | If stale > 5 minutes or never became active |
| **Mesh Network** | Multiple Shinobi Gen2/TRx can form clustered network |
| **User Roles** | Supervisor (full), Operator (execute only), Viewer (read-only) |
| **Emulator Test Range** | 400m standard, 235m RC reduced, 70m+ RMILEC minimum |
| **Safe Zone Geometry** | Points (reroute destinations), circles/polygons (protected areas, tripwires) |

---

## References

- (CUI) 441-CUASOPB4-FS-Shinobi 04 - Shinobi Dashboard (V1.11 - 1 SEP 2024).pptx
- (CUI) 441-CUASOPB4-FS-Shinobi 03 - Shinobi SDR Platform Manager (V1.11 - 1 SEP 2024).pptx
- (CUI) 441-CUASOPB4-FS-Shinobi 08 - Shinobi Emulator System (V1.11 - 1 SEP 2024).pptx
- (CUI) 441-CUASOPB4-FS-Shinobi 06 - Shinobi Special Instructions (SPINS) (V1.11 - 1 SEP 2024).pptx

---

**End of Integration Summary**
