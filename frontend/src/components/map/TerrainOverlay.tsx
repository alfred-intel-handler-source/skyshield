import { useMemo } from "react";
import { Polygon, Marker } from "react-leaflet";
import { gamePolygonToLatLng, gameXYToLatLng } from "../../utils/coordinates";
import {
  TERRAIN_STYLES,
  createTerrainLabel,
  polygonCentroid,
} from "./mapConstants";
import type { TerrainFeature } from "../../types";

interface TerrainOverlayProps {
  terrain: TerrainFeature[];
  baseLat: number;
  baseLng: number;
}

export default function TerrainOverlay({
  terrain,
  baseLat,
  baseLng,
}: TerrainOverlayProps) {
  const terrainPolygons = useMemo(
    () =>
      terrain.map((t) => ({
        terrain: t,
        positions: gamePolygonToLatLng(t.polygon, baseLat, baseLng),
        centroid: gameXYToLatLng(
          ...polygonCentroid(t.polygon),
          baseLat,
          baseLng,
        ),
      })),
    [terrain, baseLat, baseLng],
  );

  return (
    <>
      {terrainPolygons.map(({ terrain: t, positions, centroid }) => {
        const style = TERRAIN_STYLES[t.type] || TERRAIN_STYLES.building;
        return (
          <span key={t.id}>
            <Polygon
              positions={positions}
              pathOptions={{
                color: t.blocks_los ? "#f85149" : style.stroke,
                weight: t.blocks_los ? 2 : 1,
                dashArray: t.blocks_los ? "4,3" : undefined,
                fillColor: style.fill,
                fillOpacity: 0.35,
              }}
            />
            <Marker position={centroid} icon={createTerrainLabel(t.name)} />
          </span>
        );
      })}
    </>
  );
}
