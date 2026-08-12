import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { triggerSOS } from "../api/sos";
import Icon from "./Icon";

const HOLD_DURATION_MS = 1500;

export default function SOSButton({ getLocation, onTriggered }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  const clearHold = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    setProgress(0);
  };

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
    setProgress(pct);
    if (pct >= 100) {
      clearHold();
      fireSOS();
    } else {
      timerRef.current = requestAnimationFrame(tick);
    }
  };

  const startHold = () => {
    if (sending) return;
    startRef.current = Date.now();
    timerRef.current = requestAnimationFrame(tick);
  };

  const fireSOS = async () => {
    setSending(true);
    try {
      const { latitude, longitude } = await getLocation();
      const alert = await triggerSOS({ latitude, longitude, notify_police: false });
      onTriggered?.(alert);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not send SOS. Check your location permissions.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sos-wrap">
      <button
        type="button"
        className="sos-button"
        onMouseDown={startHold}
        onMouseUp={clearHold}
        onMouseLeave={clearHold}
        onTouchStart={startHold}
        onTouchEnd={clearHold}
        disabled={sending}
        style={{
          // Use the backgroundImage longhand, not the `background` shorthand — the
          // latter resets background-color too, silently wiping out the red fill
          // from the .sos-button CSS class and leaving the circle blank at rest.
          backgroundImage: `conic-gradient(#ffffff55 ${progress}%, transparent ${progress}%)`,
        }}
      >
        <Icon name="shield" size={28} />
        <span>{sending ? "…" : t("dashboard.sos_button")}</span>
      </button>
      <small className="sos-hint">{t("dashboard.sos_hold")}</small>
    </div>
  );
}
