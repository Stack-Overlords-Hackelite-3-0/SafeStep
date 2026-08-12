import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import Icon from "./Icon";
import { getCurrentLocation } from "../utils/geo";
import { buildAvatarUrl } from "../utils/avatar";

// Recreating an L.divIcon on every render gives Leaflet a new object identity even
// when the underlying HTML is unchanged, which makes react-leaflet call setIcon()
// and re-insert the marker's DOM node on every poll tick — churning the stacking
// order of markers that happen to sit at the same point. Caching by content key
// keeps the same icon instance across renders.
const iconCache = new Map();

function cachedIcon(key, build) {
  let icon = iconCache.get(key);
  if (!icon) {
    icon = build();
    iconCache.set(key, icon);
  }
  return icon;
}

// buildAvatarUrl whitelists the style segment and percent-encodes the rest, so the
// resulting URL is safe to embed directly in this marker HTML (no user text goes in).
function avatarDivIcon(style, seed, background, variant) {
  return cachedIcon(`avatar|${style}|${seed}|${background}|${variant}`, () => {
    const url = buildAvatarUrl(style, seed, background, 96);
    return L.divIcon({
      className: "",
      html: `<div class="map-avatar-marker ${variant}"><img src="${url}" alt="" /></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  });
}

// emoji and color come from a fixed lookup table the caller controls (never user text),
// so it's safe to interpolate directly into the marker HTML.
function typeDivIcon(emoji, color) {
  return cachedIcon(`type|${emoji}|${color}`, () =>
    L.divIcon({
      className: "",
      html: `<div class="map-type-marker" style="--map-marker-color:${color}"><span>${emoji}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  );
}

// When a contact's coordinates land exactly (or near-exactly) on the current
// user's own position — e.g. two accounts tested on the same device/browser —
// the two avatar markers stack perfectly and one hides the other. Nudge
// coincident contact markers a few meters apart, deterministically by id, so
// both stay visible instead of silently overlapping.
function spreadCoincidentPoints(basePosition, points) {
  if (!basePosition) return points;
  const EPSILON = 1e-5; // ~1m at the equator
  const OFFSET = 0.00015; // ~15-17m
  const taken = [basePosition];

  return points.map((p, idx) => {
    const collides = taken.some(
      ([lat, lng]) => Math.abs(lat - p.latitude) < EPSILON && Math.abs(lng - p.longitude) < EPSILON
    );
    if (!collides) {
      taken.push([p.latitude, p.longitude]);
      return p;
    }
    const angle = (idx * 137.5 * Math.PI) / 180; // golden-angle spiral so multiple collisions fan out
    const adjusted = { ...p, latitude: p.latitude + OFFSET * Math.cos(angle), longitude: p.longitude + OFFSET * Math.sin(angle) };
    taken.push([adjusted.latitude, adjusted.longitude]);
    return adjusted;
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

// Zooms out to fit the user's own position and all contact markers the first
// time a given set of contacts appears, so a trusted contact who's outside the
// default zoom level isn't just invisible off-screen. Keyed on the sorted id
// list so it re-fits when the contact set changes, but doesn't fight manual
// pan/zoom on every 20s position refresh.
function FitToContacts({ userPosition, contactMarkers }) {
  const map = useMap();
  const fittedKey = useRef(null);

  useEffect(() => {
    if (!contactMarkers.length) return;
    const key = contactMarkers.map((m) => m.id).sort().join(",");
    if (fittedKey.current === key) return;
    fittedKey.current = key;

    const points = contactMarkers.map((m) => [m.latitude, m.longitude]);
    if (userPosition) points.push(userPosition);
    if (points.length < 2) return;

    map.fitBounds(points, { padding: [60, 60], maxZoom: 15 });
  }, [contactMarkers, userPosition, map]);

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

  const spreadContactMarkers = spreadCoincidentPoints(livePosition, contactMarkers);

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
        <FitToContacts userPosition={livePosition} contactMarkers={contactMarkers} />
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
        {spreadContactMarkers.map((m, idx) => (
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
