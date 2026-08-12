import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createSafetyReport, listSafetyReports } from "../api/safetyReports";
import { getContactLocations } from "../api/location";
import HeatmapLayer from "../components/HeatmapLayer";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import { useAuth } from "../context/AuthContext";
import { getCurrentLocation } from "../utils/geo";

const CATEGORIES = ["safe", "unsafe", "well_lit", "isolated", "harassment", "suspicious_activity"];

export default function RouteIntelligence() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userPosition, setUserPosition] = useState(null);
  const [reports, setReports] = useState([]);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [category, setCategory] = useState("unsafe");
  const [description, setDescription] = useState("");
  const [contactLocations, setContactLocations] = useState([]);

  const refresh = () => listSafetyReports().then(setReports);

  useEffect(() => {
    refresh();
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setCenter([latitude, longitude]);
        setUserPosition([latitude, longitude]);
      })
      .catch(() => {});

    const refreshContactLocations = () => getContactLocations().then(setContactLocations).catch(() => {});
    refreshContactLocations();
    const interval = setInterval(refreshContactLocations, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleMapClick = (latlng) => {
    setPendingPoint(latlng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pendingPoint) return;
    await createSafetyReport({
      latitude: pendingPoint.lat,
      longitude: pendingPoint.lng,
      category,
      description: description || undefined,
    });
    setPendingPoint(null);
    setDescription("");
    refresh();
  };

  return (
    <div className="page page-fit">
      <h1>{t("routes.title")}</h1>
      <p className="hint">Click anywhere on the map to tag that location.</p>

      <div className="dashboard-grid">
        <MapView
          center={center}
          zoom={14}
          height="100%"
          onMapClick={handleMapClick}
          contactMarkers={contactLocations.map((c) => ({ ...c, id: c.contact_user_id }))}
          userPosition={userPosition}
          userAvatar={{
            name: user?.full_name,
            style: user?.avatar_style,
            seed: user?.avatar_seed || user?.email,
            background: user?.avatar_background,
          }}
        >
          <HeatmapLayer points={reports} />
        </MapView>

        <div className="side-list">
          {pendingPoint ? (
            <form className="report-form" onSubmit={handleSubmit} style={{ maxWidth: "none" }}>
              <h3>{t("routes.report")}</h3>
              <label>{t("routes.category")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`routes.${c}`)}
                  </option>
                ))}
              </select>
              <label>{t("routes.description")}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <div className="form-row">
                <button type="submit" className="btn-primary">{t("routes.submit")}</button>
                <button type="button" className="btn-secondary" onClick={() => setPendingPoint(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{t("routes.report")} ({reports.length})</h2>
              {reports.length === 0 ? (
                <p className="empty-state">{t("helpers.empty")}</p>
              ) : (
                <ul className="card-list">
                  {[...reports].reverse().map((r) => (
                    <li key={r.id} className="card-list-item">
                      <div>
                        <strong>{t(`routes.${r.category}`)}</strong>
                        {r.description && <p>{r.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
