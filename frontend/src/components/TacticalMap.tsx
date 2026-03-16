import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Polyline,
  Marker,
  useMap,
  ScaleControl,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import type { Affiliation, EngagementZones, TrackData } from "../types";
import { gameXYToLatLng } from "../utils/coordinates";

// Import leaflet CSS
import "leaflet/dist/leaflet.css";

interface Props {
  tracks: TrackData[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string | null) => void;
  engagementZones: EngagementZones | null;
  elapsed: number;
  baseLat?: number;
  baseLng?: number;
  defaultZoom?: number;
}

const AFFILIATION_COLORS: Record<Affiliation, string> = {
  unknown: "#d29922",
  hostile: "#f85149",
  friendly: "#58a6ff",
  neutral: "#3fb950",
};

// SVG icon generators for MIL-STD-2525 symbology
function createTrackIcon(
  affiliation: Affiliation,
  isSelected: boolean,
  neutralized: boolean,
): L.DivIcon {
  const color = AFFILIATION_COLORS[affiliation];
  const size = 24;
  let svg: string;

  if (neutralized) {
    svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="4" x2="20" y2="20" stroke="#484f58" stroke-width="2.5"/>
      <line x1="20" y1="4" x2="4" y2="20" stroke="#484f58" stroke-width="2.5"/>
    </svg>`;
  } else {
    const fill = `${color}33`;
    const stroke = color;
    const sw = isSelected ? 2.5 : 1.5;

    switch (affiliation) {
      case "hostile":
        // Diamond
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,2 22,12 12,22 2,12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          ${isSelected ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` : ""}
        </svg>`;
        break;
      case "friendly":
        // Rectangle
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="1" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          ${isSelected ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` : ""}
        </svg>`;
        break;
      case "neutral":
        // Square
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          ${isSelected ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` : ""}
        </svg>`;
        break;
      case "unknown":
      default:
        // Square (yellow)
        svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          ${isSelected ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="3,2" opacity="0.6"/>` : ""}
        </svg>`;
        break;
    }
  }

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createBaseIcon(): L.DivIcon {
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="6" fill="#58a6ff"/>
    <circle cx="16" cy="16" r="11" fill="none" stroke="#58a6ff" stroke-width="1.5" opacity="0.5"/>
    <text x="16" y="30" text-anchor="middle" fill="#58a6ff" font-size="7" font-weight="600" font-family="monospace">BASE</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Component to handle map click for deselecting tracks
function MapClickHandler({
  onSelectTrack,
}: {
  onSelectTrack: (id: string | null) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onSelectTrack(null);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onSelectTrack]);
  return null;
}

// Component to keep map view centered on base
function MapViewController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      map.setView(center, zoom);
      initialized.current = true;
    }
  }, [map, center, zoom]);
  return null;
}

// Pulsing base circle overlay using CSS animation
function PulsingBaseCircle({
  center,
}: {
  center: [number, number];
}) {
  return (
    <>
      <Circle
        center={center}
        radius={300}
        pathOptions={{
          color: "rgba(88, 166, 255, 0.15)",
          fillColor: "rgba(88, 166, 255, 0.04)",
          fillOpacity: 1,
          weight: 1,
          dashArray: "3,3",
        }}
      />
    </>
  );
}

// Track label tooltip shown next to marker
function TrackLabel({
  track,
  position,
}: {
  track: TrackData;
  position: [number, number];
}) {
  const color = track.neutralized
    ? "#484f58"
    : AFFILIATION_COLORS[track.affiliation];
  const html = `<div style="white-space:nowrap;pointer-events:none;">
    <span style="color:${color};font:600 10px 'JetBrains Mono',monospace;">${track.id.toUpperCase()}</span>
    ${
      !track.neutralized
        ? `<br/><span style="color:${color}99;font:400 9px 'JetBrains Mono',monospace;">${Math.round(track.confidence * 100)}%</span>`
        : ""
    }
  </div>`;

  const icon = L.divIcon({
    html,
    className: "",
    iconSize: [80, 24],
    iconAnchor: [-14, 12],
  });

  return <Marker position={position} icon={icon} interactive={false} />;
}

export default function TacticalMap({
  tracks,
  selectedTrackId,
  onSelectTrack,
  engagementZones,
  baseLat = 32.5,
  baseLng = 45.5,
  defaultZoom = 13,
}: Props) {
  const baseCenter: [number, number] = [baseLat, baseLng];

  // Compute zoom from engagement zones to fit detection range
  const zoom = useMemo(() => {
    if (!engagementZones) return defaultZoom;
    const rangeKm = engagementZones.detection_range_km;
    // Approximate: at zoom 13, ~10km fits. Each zoom doubles.
    if (rangeKm <= 2) return 15;
    if (rangeKm <= 5) return 14;
    if (rangeKm <= 10) return 13;
    return 12;
  }, [engagementZones, defaultZoom]);

  const baseIcon = useMemo(() => createBaseIcon(), []);

  // Convert track to lat/lng
  const trackPosition = useCallback(
    (track: TrackData): [number, number] => {
      return gameXYToLatLng(track.x, track.y, baseLat, baseLng);
    },
    [baseLat, baseLng],
  );

  // Convert trail points to lat/lng
  const trailToLatLng = useCallback(
    (trail: [number, number][]): [number, number][] => {
      return trail.map(([x, y]) => gameXYToLatLng(x, y, baseLat, baseLng));
    },
    [baseLat, baseLng],
  );

  // Speed leader line endpoint
  const speedLeaderEnd = useCallback(
    (track: TrackData): [number, number] | null => {
      if (track.speed_kts <= 0 || track.neutralized) return null;
      const headingRad = ((track.heading_deg - 90) * Math.PI) / 180;
      const leaderKm = (track.speed_kts / 100) * 0.5;
      const endX = track.x + Math.cos(headingRad) * leaderKm;
      const endY = track.y + Math.sin(headingRad) * leaderKm;
      return gameXYToLatLng(endX, endY, baseLat, baseLng);
    },
    [baseLat, baseLng],
  );

  // Projected path endpoint (longer dashed line)
  const projectedEnd = useCallback(
    (track: TrackData): [number, number] | null => {
      if (track.speed_kts <= 0 || track.neutralized) return null;
      const headingRad = ((track.heading_deg - 90) * Math.PI) / 180;
      const projKm = Math.max((track.speed_kts / 60) * 1.5, 0.5);
      const endX = track.x + Math.cos(headingRad) * projKm;
      const endY = track.y + Math.sin(headingRad) * projKm;
      return gameXYToLatLng(endX, endY, baseLat, baseLng);
    },
    [baseLat, baseLng],
  );

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: "#0d1117",
        width: "100%",
        height: "100%",
      }}
    >
      <MapContainer
        center={baseCenter}
        zoom={zoom}
        zoomControl={false}
        attributionControl={false}
        style={{
          width: "100%",
          height: "100%",
          background: "#0d1117",
          cursor: "crosshair",
        }}
      >
        <MapViewController center={baseCenter} zoom={zoom} />
        <MapClickHandler onSelectTrack={onSelectTrack} />
        <ScaleControl position="bottomleft" />

        {/* Layer switcher */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark">
            <TileLayer
              url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topo">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Engagement zone rings */}
        {engagementZones && (
          <>
            <Circle
              center={baseCenter}
              radius={engagementZones.detection_range_km * 1000}
              pathOptions={{
                color: "#30363d",
                fillColor: "transparent",
                fillOpacity: 0,
                weight: 1,
                dashArray: "6,4",
              }}
            />
            <Circle
              center={baseCenter}
              radius={engagementZones.engagement_range_km * 1000}
              pathOptions={{
                color: "rgba(88, 166, 255, 0.2)",
                fillColor: "transparent",
                fillOpacity: 0,
                weight: 1,
                dashArray: "6,4",
              }}
            />
            <Circle
              center={baseCenter}
              radius={engagementZones.identification_range_km * 1000}
              pathOptions={{
                color: "rgba(210, 153, 34, 0.2)",
                fillColor: "transparent",
                fillOpacity: 0,
                weight: 1,
                dashArray: "6,4",
              }}
            />
          </>
        )}

        {/* Range rings at 1km intervals */}
        {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => (
          <Circle
            key={`ring-${r}`}
            center={baseCenter}
            radius={r * 1000}
            pathOptions={{
              color: "rgba(48, 54, 61, 0.4)",
              fillColor: "transparent",
              fillOpacity: 0,
              weight: 0.5,
              dashArray: "4,6",
            }}
          />
        ))}

        {/* Base marker with pulsing circle */}
        <PulsingBaseCircle center={baseCenter} />
        <Marker
          position={baseCenter}
          icon={baseIcon}
          interactive={false}
        />

        {/* Tracks */}
        {tracks.map((track) => {
          const pos = trackPosition(track);
          const color = AFFILIATION_COLORS[track.affiliation];
          const isSelected = track.id === selectedTrackId;

          return (
            <span key={track.id}>
              {/* Trail polyline */}
              {track.trail && track.trail.length > 1 && (
                <Polyline
                  positions={trailToLatLng(track.trail)}
                  pathOptions={{
                    color,
                    weight: 1,
                    opacity: 0.5,
                  }}
                />
              )}

              {/* Projected path (dashed) */}
              {projectedEnd(track) && (
                <Polyline
                  positions={[pos, projectedEnd(track)!]}
                  pathOptions={{
                    color,
                    weight: 1,
                    opacity: 0.35,
                    dashArray: "6,4",
                  }}
                />
              )}

              {/* Speed leader line (solid) */}
              {speedLeaderEnd(track) && (
                <Polyline
                  positions={[pos, speedLeaderEnd(track)!]}
                  pathOptions={{
                    color,
                    weight: 1.5,
                    opacity: 0.7,
                  }}
                />
              )}

              {/* Track icon marker */}
              <Marker
                position={pos}
                icon={createTrackIcon(
                  track.affiliation,
                  isSelected,
                  track.neutralized,
                )}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    onSelectTrack(track.id);
                  },
                }}
              />

              {/* Track label */}
              <TrackLabel track={track} position={pos} />
            </span>
          );
        })}
      </MapContainer>

      {/* Zone labels overlay (positioned absolutely over map) */}
      {engagementZones && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 16,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          {[
            { label: "DETECTION", range: engagementZones.detection_range_km },
            { label: "ENGAGEMENT", range: engagementZones.engagement_range_km },
            { label: "ID", range: engagementZones.identification_range_km },
          ].map(({ label, range }) => (
            <span
              key={label}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "#484f58",
                background: "rgba(13, 17, 23, 0.7)",
                padding: "2px 6px",
                borderRadius: 2,
              }}
            >
              {label}: {range}km
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
