# SHINOBI Integration Research — Document Index

This folder contains comprehensive technical research for integrating SHINOBI C-UAS system concepts into the SKYSHIELD training simulator.

## Documents

### 1. **NINJA_INTEGRATION_TECHNICAL_SUMMARY.md** (21 KB)
**Comprehensive technical reference covering all SHINOBI system aspects.**

- Detection & RF capabilities (frequency bands, detection architecture, range limits)
- Countermeasures (Hold, Land Now, Reroute, Drop, Rebind, Deafen, BDA variants)
- Dashboard UI layout (Navigation Panel, Feed Panel, Main Panel, Map Toolbar)
- Track lifecycle & classification (data elements, platform recognition, affiliation model)
- SDR Platform Manager (system control, user roles, hardware management)
- Shinobi Emulator System (ES) (Library Test, Detect & Counter, Environmental Scan)
- Track signal terminology (Downlink, Uplink, Lightbridge, RMILEC, OcuSync, etc.)
- Operational procedures & SPINS (engagement rules, OPSEC, fingerprints, DTRA reporting)
- Integration recommendations for SKYSHIELD

**Use this for**: Detailed technical understanding, specifications, architecture decisions

---

### 2. **NINJA_QUICK_REFERENCE.md** (6 KB)
**Quick lookup tables and checklists for SHINOBI developers.**

- Frequency bands & detection ranges (one-page table)
- Countermeasure matrix (what works for which platforms)
- Dashboard elements (quick visual reference)
- Track data structure (JSON template)
- Affiliation colors (NATO symbology)
- Safe zone geometry types
- SDR Platform Manager endpoints
- Emulator System features
- OPSEC critical points
- Integration checklist

**Use this for**: Developer reference during coding, quick lookups, checklist verification

---

### 3. **NINJA_TO_SKYSHIELD_MAPPING.md** (9 KB)
**Detailed mapping of SHINOBI concepts to existing SKYSHIELD architecture.**

Shows what's already built, what needs enhancement, and what's missing.

**Sections:**
- Detection & Track Lifecycle (✅ exists, ❌ add, ⚠️ partial)
- Affiliation System (enum expansion, persistence, sync)
- Countermeasures (state tracking, link-type dependent selection)
- Dashboard & UI Patterns (Feed Panel, Registry, Dictionary)
- System Management (notes that SDR PM not applicable to simulator)
- Track Signal Types (DJI, Lightbridge, RMILEC recognition)
- Operational Procedures (SPINS, OPSEC warnings, DTRA logging)
- Emulator System (Library Test, D&C scenarios)

**Integration Priority** (Phase 1, 2, 3):
- Phase 1: Core data model enhancements (frequency bands, affiliation colors, Feed Panel)
- Phase 2: UI polish (Registry, settings, Dictionary)
- Phase 3: Advanced features (safe zones, scenario types, DTRA export)

**Use this for**: Planning development sprints, understanding scope, aligning with existing code

---

## Training Slide Source Material

**Location**: `/sessions/gallant-awesome-hamilton/mnt/skyshield/Module B Shinobi Slides-20260122/`

**Files extracted**:
1. (CUI) 441-CUASOPB4-FS-Shinobi 04 - Shinobi Dashboard (V1.11 - 1 SEP 2024).pptx
   - Feed Panel, Track Details, Countermeasures, Map Toolbar, Affiliation assignment

2. (CUI) 441-CUASOPB4-FS-Shinobi 03 - Shinobi SDR Platform Manager (V1.11 - 1 SEP 2024).pptx
   - User roles, system management, network settings, hardware configuration

3. (CUI) 441-CUASOPB4-FS-Shinobi 08 - Shinobi Emulator System (V1.11 - 1 SEP 2024).pptx
   - ES roles, Library Test, Detect & Counter, Environmental Scan, reporting

4. (CUI) 441-CUASOPB4-FS-Shinobi 06 - Shinobi Special Instructions (SPINS) (V1.11 - 1 SEP 2024).pptx
   - OPSEC, fingerprints, engagement rules, DTRA analysis & reporting

---

## Key Technical Facts (TL;DR)

### Frequency Bands
- **2.4 GHz**: DJI Phantom downlink, Wi-Fi
- **5.8 GHz**: DJI Phantom uplink, high-bandwidth
- **430 MHz**: Narrow-band RC links (235m range)
- **900 MHz**: Extended range tactical links

### Detection Ranges
- **400m**: Standard Gen2 detection (most signals)
- **235m**: RC detect/counter (narrow-band)
- **70m+**: RMILEC minimum distance (to avoid self-interference)

### Countermeasures Available
1. **Hold** — Pause vehicle
2. **Land Now** — Graceful landing
3. **Reroute** — Divert to safe zone
4. **Drop** — Jettison payload
5. **Rebind** — Hijack controller
6. **Deafen** — OcuSync-specific

### Countermeasure State
- **1/2**: Downlink-only detection (CM NOT affecting vehicle)
- **2/2**: Uplink detected (CM IS affecting vehicle)

### Affiliation Model (NATO Colors)

- **Blue**: Friendly (no countermeasures)
- **Green**: Friend/Neutral (countermeasures available)
- **Yellow**: Uncertain (countermeasures available)
- **Red**: Hostile (countermeasures available)

### Dashboard Components
- **Left Panel**: Navigation icons (Map, Events, Hubs, Registry, Products, Settings)
- **Right Panel**: Feed (track list, pinned section, details, countermeasures)
- **Center**: Map with geometries (safe zones, tripwires, AOI), range rings

### OPSEC Critical
- **Fingerprints**: Active countermeasures leave traces in sUAS flight logs
- **Custody Requirement**: U.S. Forces must have sUAS before pilot retrieves it
- **Passive Safe**: Detect/Track only = NO fingerprints left
- **DTRA Reporting**: Countermeasure logs submitted for analysis


---

## Development Notes

### High-Value Additions (Quick Win)
1. Add `frequency_bands[]` to TrackData (3 properties: 2.4, 5.8, 430, 900)
2. Add `uplink_detected` / `downlink_detected` booleans
3. Add `countermeasure_state` tracking (enum: "1/2", "2/2", "inactive")
4. Add `affiliation` enum expansion (blue → [blue, green, yellow, red, unknown])
5. Build simple Feed Panel component (track cards, pinned section)

### Medium-Complexity Additions
1. Affiliation Registry page (persist assignments, export/import)
2. Geolocation signal table (per-detection RSSI, SNR, source)
3. Safe zone geometry system (points for Reroute destinations)
4. Map layer manager (satellite, vector, custom overlays)

### Training Value Additions (Lower Priority)
1. Library Test scenario (canned signal replay)
2. Detect & Counter scenario (bidirectional ES ↔ Gen2 exchange)
3. SPINS briefing panel (pre-mission rules, OPSEC reminders)
4. DTRA mission export (countermeasure logs for analysis)

---

## Questions to Address During Implementation

1. **Should frequency bands be user-selectable or system-assigned?**
   - Recommend: System-assigned based on platform library match + detected signals

2. **How to handle tracks with both 2.4GHz and 5.8GHz simultaneously?**
   - Recommend: Single track with `frequency_bands: ["2.4GHz", "5.8GHz"]`

3. **Should countermeasures be selectable per frequency band?**
   - Recommend: Yes, for realistic Lightbridge split-band scenarios (2.4 uplink, 5.8 downlink)

4. **Do we need mesh network support in initial release?**
   - Recommend: No (Phase 3). Start with single system, add multi-hub later.

5. **How detailed should OPSEC warnings be?**
   - Recommend: Simple banners ("Countermeasure active — leaves traces") + pre-mission SPINS briefing

---

## References

- **SKYSHIELD Architecture**: CLAUDE.md (project guide)
- **SHINOBI Training Slides**: V1.11, dated 1 September 2024
- **Classification**: Controlled Unclassified Information (CUI)

---

**Document Date**: March 17, 2026
**Prepared by**: Claude Code Agent
**Status**: Complete Research — Ready for Development Planning

