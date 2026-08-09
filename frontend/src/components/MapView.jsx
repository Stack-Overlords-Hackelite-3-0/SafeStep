import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Vite doesn't resolve Leaflet's default marker asset URLs out of the box; point at the CDN instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo, Sri Lanka

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng);
    },
  });
  return null;
}

// MapContainer only reads `center`/`zoom` on the initial render, so when the
// caller's center arrives later (e.g. async geolocation), the map needs to be
// told explicitly to move there.
function RecenterOnChange({ center, zoom }) {
  const map = useMap();
  const lastCenter = useRef(center);

  useEffect(() => {
    const [lat, lng] = center;
    const [lastLat, lastLng] = lastCenter.current;
    if (lat !== lastLat || lng !== lastLng) {
      map.setView(center, zoom);
      lastCenter.current = center;
    }
  }, [center, zoom, map]);

  return null;
}

export default function MapView({
  center = DEFAULT_CENTER,
  zoom = 14,
  height = "400px",
  onMapClick,
  markers = [],
  userPosition,
  children,
}) {
  return (
    <div style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={center} zoom={zoom} />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {userPosition && (
          <CircleMarker
            center={userPosition}
            radius={9}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}
        {markers.map((m, idx) => (
          <Marker key={m.id || idx} position={[m.latitude, m.longitude]}>
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
        {children}
      </MapContainer>
    </div>
  );
}
