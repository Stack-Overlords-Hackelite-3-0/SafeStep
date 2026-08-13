import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { resolveSOS, triggerSOS } from "../api/sos";
import { getCurrentLocation } from "../utils/geo";
import SosOverlay, { isSosOverlaySupported, onSosOverlayStateChanged } from "../native/sosOverlay";
import Icon from "./Icon";

const HOLD_DURATION_MS = 1500;
const BUTTON_SIZE = 60;
const EDGE_MARGIN = 12;
const DRAG_THRESHOLD = 4; // px of movement before a pointerdown counts as a drag, not a hold-press
const STORAGE_POS_KEY = "safestep_sos_pos";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultPosition() {
  return {
    x: window.innerWidth - BUTTON_SIZE - 18,
    y: window.innerHeight - BUTTON_SIZE - 18,
  };
}

// Persistent, thumb-reachable SOS access on mobile, on every page including
// the Dashboard. Draggable so it can be moved out of the way of other
// controls, with its position remembered across visits.
export default function FloatingSOSButton() {
  const { t } = useTranslation();
  const [pos, setPos] = useState(null);
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [nativeBubbleActive, setNativeBubbleActive] = useState(false);
  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(0);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const nodeRef = useRef(null);
  const cleanupRef = useRef(null);

  // Restore a saved drag position, or fall back to bottom-right.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_POS_KEY);
    if (saved) {
      try {
        setPos(JSON.parse(saved));
        return;
      } catch {
        // Malformed saved value — fall through to the default position.
      }
    }
    setPos(defaultPosition());
  }, []);

  useEffect(() => () => cleanupRef.current?.(), []);

  // When the native system-wide bubble is on, showing this one too while the
  // app is open would be a redundant second SOS control on screen.
  useEffect(() => {
    if (!isSosOverlaySupported()) return;
    const refresh = () =>
      SosOverlay.isBubbleActive()
        .then(({ value }) => setNativeBubbleActive(value))
        .catch(() => {});
    refresh();
    window.addEventListener("focus", refresh);
    const unsubscribe = onSosOverlayStateChanged(refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      unsubscribe();
    };
  }, []);

  const savePos = (next) => {
    setPos(next);
    localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(next));
  };

  const clearHold = () => {
    if (holdTimerRef.current) cancelAnimationFrame(holdTimerRef.current);
    holdTimerRef.current = null;
    setProgress(0);
  };

  const tick = () => {
    if (dragRef.current.moved) {
      // The press turned into a drag — abandon the hold-to-trigger countdown.
      clearHold();
      return;
    }
    const elapsed = Date.now() - holdStartRef.current;
    const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
    setProgress(pct);
    if (pct >= 100) {
      clearHold();
      fireSOS();
    } else {
      holdTimerRef.current = requestAnimationFrame(tick);
    }
  };

  const fireSOS = async () => {
    setSending(true);
    try {
      const { latitude, longitude } = await getCurrentLocation();
      const alert = await triggerSOS({ latitude, longitude, notify_police: false });
      setAlertInfo(alert);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not send SOS. Check your location permissions.");
    } finally {
      setSending(false);
    }
  };

  const handleMarkSafe = async () => {
    if (!alertInfo) return;
    await resolveSOS(alertInfo.id);
    setAlertInfo(null);
  };

  // Deliberately NOT using setPointerCapture: capturing the pointer on every
  // pointerdown reroutes the browser's synthesized click, which would break
  // taps. Tracking movement via window listeners avoids that while still
  // following the pointer outside the button's bounds during a drag.
  const handlePointerDown = (e) => {
    if (!pos || sending) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };

    if (!alertInfo) {
      holdStartRef.current = Date.now();
      holdTimerRef.current = requestAnimationFrame(tick);
    }

    const handleMove = (moveEvent) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      clearHold();

      const rect = nodeRef.current?.getBoundingClientRect();
      const w = rect?.width || BUTTON_SIZE;
      const h = rect?.height || BUTTON_SIZE;
      savePos({
        x: clamp(drag.origX + dx, EDGE_MARGIN, window.innerWidth - w - EDGE_MARGIN),
        y: clamp(drag.origY + dy, EDGE_MARGIN, window.innerHeight - h - EDGE_MARGIN),
      });
    };

    const handleUp = () => {
      dragRef.current.active = false;
      clearHold();
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      cleanupRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    cleanupRef.current = handleUp;
  };

  if (!pos || nativeBubbleActive) return null;

  return (
    <>
      {alertInfo && (
        <div className="floating-sos-alert">
          <strong>{t("sos.confirm_title")}</strong>
          <p>{t("sos.notified", { names: alertInfo.notified_contacts.join(", ") || "—" })}</p>
          <button type="button" className="btn-secondary" onClick={handleMarkSafe}>
            {t("sos.resolve")}
          </button>
        </div>
      )}
      <button
        ref={nodeRef}
        type="button"
        className="floating-sos-btn"
        onPointerDown={handlePointerDown}
        disabled={sending}
        aria-label={t("dashboard.sos_hold")}
        title={t("dashboard.sos_hold")}
        style={{
          left: pos.x,
          top: pos.y,
          backgroundImage: `conic-gradient(#ffffff55 ${progress}%, transparent ${progress}%)`,
        }}
      >
        <Icon name="shield" size={22} />
      </button>
    </>
  );
}
