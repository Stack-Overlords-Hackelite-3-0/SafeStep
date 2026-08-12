import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNearbyHelpers } from "../api/helpers";
import { getNearbyPublicPlaces } from "../api/publicPlaces";
import { getDirections } from "../api/directions";
import { getContactLocations } from "../api/location";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import { useAuth } from "../context/AuthContext";
import { getCurrentLocation } from "../utils/geo";

const TYPE_STYLES = {
  volunteer: { icon: "🧑‍🤝‍🧑", color: "#7c3aed" },
  shop: { icon: "🏪", color: "#db2777" },
  police_station: { icon: "🚓", color: "#2563eb" },
  safe_house: { icon: "🏠", color: "#92400e" },
  hospital: { icon: "🏥", color: "#dc2626" },
  fire_station: { icon: "🚒", color: "#ea580c" },
  pharmacy: { icon: "💊", color: "#16a34a" },
  clinic: { icon: "⚕️", color: "#0d9488" },
};
const FALLBACK_STYLE = { icon: "🤝", color: "#2563eb" };

export default function Helpers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [helpers, setHelpers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userPosition, setUserPosition] = useState(null);
  const [contactLocations, setContactLocations] = useState([]);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    const loadNearby = (lat, lng) =>
      Promise.all([
        getNearbyHelpers(lat, lng, 10).catch(() => []),
        getNearbyPublicPlaces(lat, lng, 5).catch(() => []),
      ]).then(([h, p]) => {
        setHelpers(h);
        setPlaces(p);
      });

    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setCenter([latitude, longitude]);
        setUserPosition([latitude, longitude]);
        return loadNearby(latitude, longitude);
      })
      .catch(() => loadNearby(center[0], center[1]));

    const refreshContactLocations = () => getContactLocations().then(setContactLocations).catch(() => {});
    refreshContactLocations();
    const interval = setInterval(refreshContactLocations, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const helperMarkers = helpers.map((h) => ({
    ...h,
    popup: h.name,
    icon: (TYPE_STYLES[h.helper_type] || FALLBACK_STYLE).icon,
    color: (TYPE_STYLES[h.helper_type] || FALLBACK_STYLE).color,
  }));
  const placeMarkers = places.map((p) => ({
    ...p,
    popup: p.name,
    icon: (TYPE_STYLES[p.place_type] || FALLBACK_STYLE).icon,
    color: (TYPE_STYLES[p.place_type] || FALLBACK_STYLE).color,
  }));

  const legendTypes = Array.from(
    new Set([...helpers.map((h) => h.helper_type), ...places.map((p) => p.place_type)])
  );

  const handleSelectMarker = async (marker) => {
    if (!userPosition) {
      setRouteError("Your location isn't available yet.");
      return;
    }
    setRouteError(null);
    setRouteLoading(true);
    try {
      const directions = await getDirections(userPosition[0], userPosition[1], marker.latitude, marker.longitude);
      setRoute({ ...directions, name: marker.name });
    } catch {
      setRouteError(`Couldn't find a route to ${marker.name}.`);
      setRoute(null);
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>{t("helpers.title")} ({helpers.length + places.length})</h1>

      {legendTypes.length > 0 && (
        <div className="map-legend">
          {legendTypes.map((type) => {
            const style = TYPE_STYLES[type] || FALLBACK_STYLE;
            return (
              <span className="map-legend-item" key={type}>
                <span className="map-legend-swatch" style={{ "--map-marker-color": style.color }}>
                  {style.icon}
                </span>
                {t(`helpers.types.${type}`, { defaultValue: type })}
              </span>
            );
          })}
        </div>
      )}

      {routeLoading && <p className="route-info-bar">Finding the shortest path…</p>}
      {routeError && !routeLoading && <p className="route-info-bar">{routeError}</p>}
      {route && !routeLoading && (
        <div className="route-info-bar">
          <span>Route to <strong>{route.name}</strong>: {route.distance_km} km · {route.duration_min} min on foot</span>
          <button type="button" onClick={() => setRoute(null)}>Clear</button>
        </div>
      )}

      <div className="dashboard-grid">
        <MapView
          center={center}
          zoom={13}
          height="560px"
          markers={[...helperMarkers, ...placeMarkers]}
          contactMarkers={contactLocations.map((c) => ({ ...c, id: c.contact_user_id }))}
          userPosition={userPosition}
          userAvatar={{
            name: user?.full_name,
            style: user?.avatar_style,
            seed: user?.avatar_seed || user?.email,
            background: user?.avatar_background,
          }}
          routePath={route?.coordinates}
          onMarkerSelect={handleSelectMarker}
        />

        <div className="side-list">
          {helpers.length === 0 ? (
            <p className="empty-state">{t("helpers.empty")}</p>
          ) : (
            <ul className="card-list">
              {helpers.map((h) => (
                <li key={h.id} className="card-list-item">
                  <div>
                    <strong>{(TYPE_STYLES[h.helper_type] || FALLBACK_STYLE).icon} {h.name}</strong>
                    <p>
                      {h.phone} {h.distance_km != null && `• ${t("helpers.distance", { km: h.distance_km })}`}
                    </p>
                  </div>
                  {h.verified && <span className="badge">✓</span>}
                </li>
              ))}
            </ul>
          )}

          <h2>{t("helpers.placesTitle")}</h2>
          {places.length === 0 ? (
            <p className="empty-state">{t("helpers.placesEmpty")}</p>
          ) : (
            <ul className="card-list">
              {places.map((p) => (
                <li key={p.id} className="card-list-item">
                  <div>
                    <strong>{(TYPE_STYLES[p.place_type] || FALLBACK_STYLE).icon} {p.name}</strong>
                    <p>{t(`helpers.types.${p.place_type}`, { defaultValue: p.place_type })} • {t("helpers.distance", { km: p.distance_km })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
