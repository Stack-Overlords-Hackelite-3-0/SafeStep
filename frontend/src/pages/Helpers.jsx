import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNearbyHelpers } from "../api/helpers";
import { getContactLocations } from "../api/location";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import { useAuth } from "../context/AuthContext";
import { getCurrentLocation } from "../utils/geo";

const TYPE_ICON = {
  volunteer: "🧑‍🤝‍🧑",
  shop: "🏪",
  police_station: "🚓",
  safe_house: "🏠",
};

export default function Helpers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [helpers, setHelpers] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userPosition, setUserPosition] = useState(null);
  const [contactLocations, setContactLocations] = useState([]);

  useEffect(() => {
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setCenter([latitude, longitude]);
        setUserPosition([latitude, longitude]);
        return getNearbyHelpers(latitude, longitude, 10);
      })
      .then(setHelpers)
      .catch(() => getNearbyHelpers(center[0], center[1], 10).then(setHelpers).catch(() => {}));

    const refreshContactLocations = () => getContactLocations().then(setContactLocations).catch(() => {});
    refreshContactLocations();
    const interval = setInterval(refreshContactLocations, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <h1>{t("helpers.title")} ({helpers.length})</h1>

      <div className="dashboard-grid">
        <MapView
          center={center}
          zoom={13}
          height="560px"
          markers={helpers.map((h) => ({ ...h, popup: h.name }))}
          contactMarkers={contactLocations.map((c) => ({ ...c, id: c.contact_user_id }))}
          userPosition={userPosition}
          userAvatar={{
            name: user?.full_name,
            style: user?.avatar_style,
            seed: user?.avatar_seed || user?.email,
            background: user?.avatar_background,
          }}
        />

        <div className="side-list">
          {helpers.length === 0 ? (
            <p className="empty-state">{t("helpers.empty")}</p>
          ) : (
            <ul className="card-list">
              {helpers.map((h) => (
                <li key={h.id} className="card-list-item">
                  <div>
                    <strong>{TYPE_ICON[h.helper_type] || "🤝"} {h.name}</strong>
                    <p>
                      {h.phone} {h.distance_km != null && `• ${t("helpers.distance", { km: h.distance_km })}`}
                    </p>
                  </div>
                  {h.verified && <span className="badge">✓</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
