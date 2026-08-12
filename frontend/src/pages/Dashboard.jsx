import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listContacts } from "../api/contacts";
import { listCheckIns } from "../api/checkins";
import { getNearbyHelpers } from "../api/helpers";
import { getContactLocations, startShare, stopShare, updateLocation } from "../api/location";
import { resolveSOS } from "../api/sos";
import FakeCallModal from "../components/FakeCallModal";
import Icon from "../components/Icon";
import MapView, { DEFAULT_CENTER } from "../components/MapView";
import ShareLocationModal from "../components/ShareLocationModal";
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
  const [userPosition, setUserPosition] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [contactLocations, setContactLocations] = useState([]);

  useEffect(() => {
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setCenter([latitude, longitude]);
        setUserPosition([latitude, longitude]);
        getNearbyHelpers(latitude, longitude, 8).then(setHelpers).catch(() => {});
      })
      .catch(() => {
        // Fall back to the default map center if permission is denied.
        getNearbyHelpers(center[0], center[1], 8).then(setHelpers).catch(() => {});
      });
    listContacts().then(setContacts).catch(() => {});
    listCheckIns().then(setCheckins).catch(() => {});

    const refreshContactLocations = () => getContactLocations().then(setContactLocations).catch(() => {});
    refreshContactLocations();
    const interval = setInterval(refreshContactLocations, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sharing) return;
    const pushLocation = () => {
      getCurrentLocation()
        .then(({ latitude, longitude }) => {
          setUserPosition([latitude, longitude]);
          return updateLocation(latitude, longitude);
        })
        .catch(() => {});
    };
    const interval = setInterval(pushLocation, 20000);
    return () => clearInterval(interval);
  }, [sharing]);

  const nextCheckIn = checkins
    .filter((c) => c.status === "pending")
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))[0];

  const handleShareTileClick = async () => {
    if (sharing) {
      setShowShareModal(true);
      return;
    }
    const { latitude, longitude } = await getCurrentLocation();
    await updateLocation(latitude, longitude);
    const info = await startShare(4);
    setSharing(true);
    setShareInfo(info);
    setShowShareModal(true);
  };

  const handleStopShare = async () => {
    await stopShare();
    setSharing(false);
    setShareInfo(null);
    setShowShareModal(false);
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

      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-label">{t("nav.contacts")}</div>
          <div className="stat-value">{contacts.length}</div>
          <div className="stat-sub">{contacts.length === 0 ? t("contacts.empty") : t("nav.contacts")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("checkins.title")}</div>
          <div className="stat-value">
            {nextCheckIn ? new Date(nextCheckIn.scheduled_time).toLocaleString() : "—"}
          </div>
          <div className="stat-sub">
            {nextCheckIn ? t("checkins.status_pending") : t("checkins.title")}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dashboard.start_share")}</div>
          <div className="stat-value">{sharing ? "🟢" : "⚪"}</div>
          <div className="stat-sub">{sharing ? t("dashboard.stop_share") : t("dashboard.start_share")}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-map">
          <MapView
            center={center}
            zoom={14}
            height="360px"
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
        </div>

        <div className="dashboard-actions">
          <div className="sos-panel">
            <SOSButton getLocation={getCurrentLocation} onTriggered={setActiveAlert} />
          </div>

          <div className="action-tiles">
            <button type="button" className="action-tile" onClick={() => setShowFakeCall(true)}>
              <span className="action-tile-icon">
                <Icon name="phone" size={22} />
              </span>
              <span>{t("dashboard.fake_call")}</span>
            </button>

            <button
              type="button"
              className={sharing ? "action-tile active" : "action-tile"}
              onClick={handleShareTileClick}
            >
              <span className="action-tile-icon">
                <Icon name="pin" size={22} />
              </span>
              <span>{sharing ? t("dashboard.stop_share") : t("dashboard.start_share")}</span>
            </button>
          </div>
        </div>
      </div>

      {showFakeCall && (
        <FakeCallModal
          callerName={user?.fake_caller_name || "Mom"}
          onClose={() => setShowFakeCall(false)}
        />
      )}

      {showShareModal && shareInfo && (
        <ShareLocationModal
          shareUrl={`${window.location.origin}${shareInfo.share_path}`}
          onStopSharing={handleStopShare}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
