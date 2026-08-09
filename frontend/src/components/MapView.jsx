import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

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

export default function MapView({
  center = DEFAULT_CENTER,
  zoom = 14,
  height = "400px",
  onMapClick,
  markers = [],
  children,
}) {
  return (
    <div style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
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
