import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getNearbyHelpers } from "../api/helpers";
import { startShare, stopShare, updateLocation } from "../api/location";
import { resolveSOS } from "../api/sos";
import FakeCallModal from "../components/FakeCallModal";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import SOSButton from "../components/SOSButton";
import { useAuth } from "../context/AuthContext";
import { getCurrentLocation } from "../utils/geo";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [helpers, setHelpers] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [sharing, setSharing] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);

  useEffect(() => {
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setCenter([latitude, longitude]);
        getNearbyHelpers(latitude, longitude, 8).then(setHelpers).catch(() => {});
      })
      .catch(() => {
        // Fall back to the default map center if permission is denied.
        getNearbyHelpers(center[0], center[1], 8).then(setHelpers).catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShareToggle = async () => {
    if (sharing) {
      await stopShare();
      setSharing(false);
      setShareInfo(null);
      return;
    }
    const { latitude, longitude } = await getCurrentLocation();
    await updateLocation(latitude, longitude);
    const info = await startShare(4);
    setSharing(true);
    setShareInfo(info);
  };

  const handleMarkSafe = async () => {
    if (!activeAlert) return;
    await resolveSOS(activeAlert.id);
    setActiveAlert(null);
  };

  return (
    <div className="page">
      <h1>{t("dashboard.welcome", { name: user?.full_name?.split(" ")[0] || "" })}</h1>

      {activeAlert && (
        <div className="alert-banner">
          <strong>{t("sos.confirm_title")}</strong>
          <p>{t("sos.notified", { names: activeAlert.notified_contacts.join(", ") || "—" })}</p>
          <button type="button" className="btn-secondary" onClick={handleMarkSafe}>
            {t("sos.resolve")}
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-map">
          <MapView center={center} zoom={14} height="360px" markers={helpers.map((h) => ({ ...h, popup: h.name }))} />
        </div>

        <div className="dashboard-actions">
          <SOSButton getLocation={getCurrentLocation} onTriggered={setActiveAlert} />

          <button type="button" className="btn-secondary full-width" onClick={() => setShowFakeCall(true)}>
            {t("dashboard.fake_call")}
          </button>

          <button type="button" className="btn-secondary full-width" onClick={handleShareToggle}>
            {sharing ? t("dashboard.stop_share") : t("dashboard.start_share")}
          </button>
          {shareInfo && (
            <p className="share-link">
              {window.location.origin}{shareInfo.share_path}
            </p>
          )}

          <div className="quick-links">
            <Link to="/routes" className="quick-link-card">🗺️ {t("nav.routes")}</Link>
            <Link to="/chatbot" className="quick-link-card">💬 {t("nav.chatbot")}</Link>
            <Link to="/helpers" className="quick-link-card">🤝 {t("nav.helpers")}</Link>
            <Link to="/checkins" className="quick-link-card">⏱️ {t("nav.checkins")}</Link>
          </div>
        </div>
      </div>

      {showFakeCall && (
        <FakeCallModal
          callerName={user?.fake_caller_name || "Mom"}
          onClose={() => setShowFakeCall(false)}
        />
      )}
    </div>
  );
}
