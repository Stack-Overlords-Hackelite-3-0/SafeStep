import L from "leaflet";
import "leaflet.heat";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const CATEGORY_WEIGHT = {
  unsafe: 1,
  harassment: 1,
  suspicious_activity: 0.9,
  isolated: 0.6,
  well_lit: 0.2,
  safe: 0.1,
};

export default function HeatmapLayer({ points = [] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return undefined;

    const heatPoints = points.map((p) => [
      p.latitude,
      p.longitude,
      CATEGORY_WEIGHT[p.category] ?? 0.5,
    ]);
    const heatLayer = L.heatLayer(heatPoints, { radius: 28, blur: 20, maxZoom: 17 });
    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
