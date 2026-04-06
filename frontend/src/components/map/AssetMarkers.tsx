import { Marker } from "react-leaflet";
import { gameXYToLatLng, latLngToGameXY } from "../../utils/coordinates";
import { createAssetIcon } from "./mapConstants";
import type { ProtectedAsset } from "../../types";
import L from "leaflet";

interface AssetMarkersProps {
  assets: ProtectedAsset[];
  positions: Record<string, { x: number; y: number }>;
  baseLat: number;
  baseLng: number;
  onMove: (assetId: string, x: number, y: number) => void;
}

export default function AssetMarkers({
  assets,
  positions,
  baseLat,
  baseLng,
  onMove,
}: AssetMarkersProps) {
  return (
    <>
      {assets.map((asset) => {
        const pos = positions[asset.id] || { x: asset.x, y: asset.y };
        const latLng = gameXYToLatLng(pos.x, pos.y, baseLat, baseLng);
        return (
          <Marker
            key={asset.id}
            position={latLng}
            icon={createAssetIcon(asset.priority, asset.name)}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                const { x, y } = latLngToGameXY(ll.lat, ll.lng, baseLat, baseLng);
                onMove(asset.id, x, y);
              },
            }}
          />
        );
      })}
    </>
  );
}
