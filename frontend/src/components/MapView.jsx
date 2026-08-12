import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import Icon from "./Icon";
import { getCurrentLocation } from "../utils/geo";
import { buildAvatarUrl } from "../utils/avatar";

// buildAvatarUrl whitelists the style segment and percent-encodes the rest, so the
// resulting URL is safe to embed directly in this marker HTML (no user text goes in).
function avatarDivIcon(style, seed, background, variant) {
  const url = buildAvatarUrl(style, seed, background, 96);
  return L.divIcon({
    className: "",
    html: `<div class="map-avatar-marker ${variant}"><img src="${url}" alt="" /></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

// emoji and color come from a fixed lookup table the caller controls (never user text),
// so it's safe to interpolate directly into the marker HTML.
function typeDivIcon(emoji, color) {
  return L.divIcon({
    className: "",
    html: `<div class="map-type-marker" style="--map-marker-color:${color}"><span>${emoji}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

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
  contactMarkers = [],
  userPosition,
  userAvatar,
  showLocate = true,
  routePath,
  onMarkerSelect,
  children,
}) {
  const mapRef = useRef(null);
  const [livePosition, setLivePosition] = useState(userPosition || null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (userPosition) setLivePosition(userPosition);
  }, [userPosition]);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const { latitude, longitude } = await getCurrentLocation();
      setLivePosition([latitude, longitude]);
      const map = mapRef.current;
      if (map) map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15));
    } catch {
      // Location unavailable or denied — leave the map where it was.
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="map-wrapper" style={{ height, width: "100%" }}>
      <MapContainer ref={mapRef} center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={center} zoom={zoom} />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {livePosition && userAvatar ? (
          <Marker
            position={livePosition}
            icon={avatarDivIcon(userAvatar.style, userAvatar.seed, userAvatar.background, "self")}
          >
            <Tooltip permanent direction="top" offset={[0, -36]} className="map-contact-label">
              {userAvatar.name || "You"}
            </Tooltip>
          </Marker>
        ) : (
          livePosition && (
            <CircleMarker
              center={livePosition}
              radius={9}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
            >
              <Popup>You are here</Popup>
            </CircleMarker>
          )
        )}
        {markers.map((m, idx) => (
          <Marker
            key={m.id || idx}
            position={[m.latitude, m.longitude]}
            {...(m.icon ? { icon: typeDivIcon(m.icon, m.color || "#2563eb") } : {})}
          >
            {(m.popup || onMarkerSelect) && (
              <Popup>
                {m.popup}
                {onMarkerSelect && (
                  <div>
                    <button type="button" className="map-popup-route-btn" onClick={() => onMarkerSelect(m)}>
                      Directions
                    </button>
                  </div>
                )}
              </Popup>
            )}
          </Marker>
        ))}
        {routePath?.length > 1 && (
          <Polyline positions={routePath} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.75 }} />
        )}
        {contactMarkers.map((m, idx) => (
          <Marker
            key={m.id || idx}
            position={[m.latitude, m.longitude]}
            icon={avatarDivIcon(m.avatar_style, m.avatar_seed, m.avatar_background, "contact")}
          >
            <Tooltip permanent direction="top" offset={[0, -36]} className="map-contact-label">
              {m.name}
            </Tooltip>
          </Marker>
        ))}
        {children}
      </MapContainer>
      {showLocate && (
        <button
          type="button"
          className={locating ? "map-locate-btn locating" : "map-locate-btn"}
          onClick={handleLocate}
          disabled={locating}
          aria-label="Show my location"
          title="Show my location"
        >
          <Icon name="target" size={18} />
        </button>
      )}
    </div>
  );
}
