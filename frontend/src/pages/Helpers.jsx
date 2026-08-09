import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNearbyHelpers } from "../api/helpers";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import { getCurrentLocation } from "../utils/geo";

const TYPE_ICON = {
  volunteer: "🧑‍🤝‍🧑",
  shop: "🏪",
  police_station: "🚓",
  safe_house: "🏠",
};

export default function Helpers() {
  const { t } = useTranslation();
  const [helpers, setHelpers] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setCenter([latitude, longitude]);
        return getNearbyHelpers(latitude, longitude, 10);
      })
      .then(setHelpers)
      .catch(() => getNearbyHelpers(center[0], center[1], 10).then(setHelpers).catch(() => {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <h1>{t("helpers.title")}</h1>
      <MapView center={center} zoom={13} height="320px" markers={helpers.map((h) => ({ ...h, popup: h.name }))} />

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
  );
}
