import { useMemo } from "react";
import { Polyline, Marker } from "react-leaflet";
import { gameXYToLatLng } from "../../utils/coordinates";
import { createTerrainLabel, degToRad } from "./mapConstants";
import type { ApproachCorridor } from "../../types";

interface CorridorLinesProps {
  corridors: ApproachCorridor[];
  baseLat: number;
  baseLng: number;
  boundsKm: number;
}

export default function CorridorLines({
  corridors,
  baseLat,
  baseLng,
  boundsKm,
}: CorridorLinesProps) {
  const baseCenter = gameXYToLatLng(0, 0, baseLat, baseLng);

  const corridorData = useMemo(() => {
    const extendedBounds = boundsKm * 1.2;
    return corridors.map((corridor) => {
      const bearingRad = degToRad(90 - corridor.bearing_deg);
      const endX = Math.cos(bearingRad) * extendedBounds;
      const endY = Math.sin(bearingRad) * extendedBounds;
      const end = gameXYToLatLng(endX, endY, baseLat, baseLng);
      const labelDist = extendedBounds * 0.85;
      const labelX = Math.cos(bearingRad) * labelDist;
      const labelY = Math.sin(bearingRad) * labelDist;
      const labelPos = gameXYToLatLng(labelX, labelY, baseLat, baseLng);
      return { corridor, end, labelPos };
    });
  }, [corridors, baseLat, baseLng, boundsKm]);

  return (
    <>
      {corridorData.map(({ corridor, end, labelPos }) => (
        <span key={corridor.name}>
          <Polyline
            positions={[baseCenter, end]}
            pathOptions={{
              color: "#484f58",
              weight: 1,
              dashArray: "6,4",
              opacity: 0.7,
            }}
          />
          <Marker
            position={labelPos}
            icon={createTerrainLabel(
              `${corridor.name} (${corridor.bearing_deg}\u00B0)`,
            )}
          />
        </span>
      ))}
    </>
  );
}
