# SHINOBI Integration — Quick Reference for SKYSHIELD Development

## Frequency Bands & Detection Ranges

| Band | Primary Use | Gen2 Range | Notes |
|------|------------|------------|-------|
| 2.4 GHz | DJI downlink, Wi-Fi | 400m | Primary civilian band |
| 5.8 GHz | DJI uplink, extended | 400m | Higher data rates |
| 430 MHz | RC links | 235m | Narrow-band, reduced range |
| 900 MHz | Tactical, SiK | 400m | Extended range links |

## Countermeasure Matrix

### Lightbridge-Capable Platforms
- **Hold**: Pause vehicle
- **Land Now**: Graceful landing
- **Reroute**: To safe zone (requires predefined points)
- **Rebind**: Hijack uplink (needs TX ID)

### Multi-Band Capability
- Single Gen2 can engage **two Lightbridge drones simultaneously** (if on different bands: one 2.4GHz, one 5.8GHz)

### Countermeasure Activation State
- **1/2**: Downlink detected only → countermeasure NOT affecting vehicle
- **2/2**: Uplink detected → countermeasure IS affecting vehicle

## Dashboard Elements

### Left Navigation Panel
```
Icons (scrollable):
- Map (geospatial tools, layers, geometries)
- Events (alert log)
- Hubs (system status, archived tracks)
- Target Registry (affiliation assignment)
- Products (exports, logs)
- Settings (UI, supervisor controls)
```

### Right Feed Panel
- **Live track list** (card or table layout)
- **Pinned Tracks** section (auto-pinned when countermeasure active)
- **Status indicators** (green flashing = receiving data)
- **Track details expandable** (signals table, entities, countermeasures)

### Center Map
- **Track symbols** (colored by NATO affiliation: Blue/Green/Yellow/Red)
- **Map toolbar**: Geometries (safe zones, tripwires, AOI), Range rings, History/predictions
- **Interactive layers**: Satellite, vector tiles, custom overlays

## Track Data Structure

```javascript
{
  id: "DJI-4",                           // Auto-generated ID
  display_name: "DJI Phantom 4",         // Library-matched
  frequency_bands: ["2.4GHz", "5.8GHz"], // Can be multiple
  tx_id: "P4-RX2B3C",                   // Transmitter ID (for Rebind)
  affiliation: "yellow",                 // blue/green/yellow/red (default: unknown)
  last_detected: 1710678240,             // Unix timestamp
  signals: [
    {
      system: "Gen2-North",
      frequency: "2.4GHz",
      rssi: -65,                         // dBm
      snr: 12,                           // dB
      emitter: "downlink"                // downlink/uplink/bidirectional
    }
  ],
  countermeasures_available: ["hold", "land_now", "reroute"],
  countermeasure_state: "2/2",          // 1/2 (DL only) or 2/2 (UL active)
  coasting: false,
  stale_timeout: 300                    // seconds until removal (default 5min)
}
```

## Affiliation Colors (NATO Symbology)

| Color | Meaning | Countermeasures |
|-------|---------|-----------------|
| Blue | Friendly | NONE |
| Green | Friend/Neutral | Available |
| Yellow | Uncertain | Available |
| Red | Hostile/Enemy | Available |
| Unknown | Unassigned | NONE |

## Safe Zone Geometry System

### Point Geometry
- **Purpose**: Reroute destination (default or custom)
- **Usage**: Lightbridge REROUTE countermeasure selects from list of safe zone points
- **Mesh Network**: All networked systems' safe zones available to user

### Circle Geometry
- **Purpose**: Protected area / exclusion zone / tripwire
- **Properties**: Center lat/lon, radius (meters)
- **Triggers**: Tripwire alerts when track crosses boundary

### Polygon Geometry
- **Purpose**: Complex protected area or AOI (Area of Interest)
- **Properties**: Vertex list
- **Triggers**: Same as circles for tripwire/AOI

## SDR Platform Manager Endpoints & Functions

| URL | Purpose | User Role |
|-----|---------|-----------|
| https://192.168.5.81/platform | Gen2 system management | Supervisor only |
| https://192.168.5.30/platform | Emulator system management | Supervisor only |

### User Roles
- **Supervisor**: Full Platform Manager + Dashboard access, create/manage users
- **Operator**: Dashboard execute-only (no platform mgmt)
- **Viewer**: Dashboard read-only

## Emulator System (ES) Features

### Library Test
- Transmit pre-recorded sUAS signals
- Training/validation of detection
- High power level (functional test)

### Detect and Counter (D&C)
- ES transmits test signal → Gen2 detects → operator sends countermeasure
- Validates operator proficiency
- TX ID variants: `LB` (Lightbridge), `P#` (Phantom #), `PR` (PRO), `24`/`58` (band)

### Environmental Scan
- RF noise assessment across 100MHz band
- Results: NORMAL, EXPANDED, MEAN, MAX views
- Exported via Platform Manager

## OPSEC Critical Points

1. **Fingerprints**: Active countermeasures leave traces in sUAS flight logs
2. **Custody Requirement**: U.S. Forces must have sUAS before pilot retrieves it
3. **Internet Isolation**: Do NOT let countered sUAS connect to internet post-engagement
4. **DTRA Reporting**: Log files submitted via IntelDocs for analysis
5. **Passive Safe**: Detect/Track only → NO fingerprints left

## Integration Checklist for SKYSHIELD

- [ ] Track model includes `frequency_bands` array
- [ ] Track model includes `uplink_detected` / `downlink_detected` booleans
- [ ] Track model includes `rssi`, `snr` metrics per signal
- [ ] Countermeasure state machine: 1/2 vs 2/2 tracking
- [ ] Safe zone geometry system (point, circle, polygon)
- [ ] Affiliation assignment UI (Blue/Green/Yellow/Red selector)
- [ ] Mesh network hub selector for countermeasure execution
- [ ] Track pinning/ignoring/tagging system
- [ ] Geolocation table display (signal source, frequency, RSSI, SNR)
- [ ] SPINS/ROE briefing panel pre-mission
- [ ] Range ring visualization (color-coded per sensor)
- [ ] DTRA reporting integration (mission log export)

## File Paths in SKYSHIELD Project

- Full technical summary: `/sessions/gallant-awesome-hamilton/mnt/skyshield/NINJA_INTEGRATION_TECHNICAL_SUMMARY.md`
- Training slide source: `/sessions/gallant-awesome-hamilton/mnt/skyshield/Module B Shinobi Slides-20260122/`

---

**Last Updated**: March 17, 2026
