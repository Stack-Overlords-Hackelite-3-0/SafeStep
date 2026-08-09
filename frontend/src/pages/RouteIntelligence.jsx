import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createSafetyReport, listSafetyReports } from "../api/safetyReports";
import HeatmapLayer from "../components/HeatmapLayer";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import { getCurrentLocation } from "../utils/geo";

const CATEGORIES = ["safe", "unsafe", "well_lit", "isolated", "harassment", "suspicious_activity"];

export default function RouteIntelligence() {
  const { t } = useTranslation();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [reports, setReports] = useState([]);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [category, setCategory] = useState("unsafe");
  const [description, setDescription] = useState("");

  const refresh = () => listSafetyReports().then(setReports);

  useEffect(() => {
    refresh();
    getCurrentLocation()
      .then(({ latitude, longitude }) => setCenter([latitude, longitude]))
      .catch(() => {});
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
    <div className="page">
      <h1>{t("routes.title")}</h1>
      <p className="hint">Click anywhere on the map to tag that location.</p>

      <MapView center={center} zoom={14} height="380px" onMapClick={handleMapClick}>
        <HeatmapLayer points={reports} />
      </MapView>

      {pendingPoint && (
        <form className="report-form" onSubmit={handleSubmit}>
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
      )}
    </div>
  );
}
