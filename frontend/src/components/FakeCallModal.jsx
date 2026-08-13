import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const MOBILE_BREAKPOINT = 860;

// Plays a simple two-tone ringtone using the Web Audio API so the "incoming
// call" is convincing without bundling any audio assets.
function playRingtone(audioCtxRef) {
  const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
  audioCtxRef.current = ctx;

  const now = ctx.currentTime;
  [0, 1].forEach((ring) => {
    const start = now + ring * 1.2;
    [480, 620].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
      gain.gain.linearRampToValueAtTime(0, start + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.95);
    });
  });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function FakeCallModal({ callerName = "Mom", onClose }) {
  const { t } = useTranslation();
  const isMobile = useIsMobileViewport();
  const [phase, setPhase] = useState("ringing"); // ringing | active
  const [minimized, setMinimized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    playRingtone(audioCtxRef);
    ringIntervalRef.current = setInterval(() => playRingtone(audioCtxRef), 2600);
    return () => {
      clearInterval(ringIntervalRef.current);
      clearInterval(durationIntervalRef.current);
      audioCtxRef.current?.close?.();
    };
  }, []);

  const accept = () => {
    clearInterval(ringIntervalRef.current);
    setPhase("active");
    durationIntervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const hangUp = () => {
    clearInterval(ringIntervalRef.current);
    clearInterval(durationIntervalRef.current);
    onClose();
  };

  const initial = callerName.charAt(0).toUpperCase();

  // Minimized pill — floats above whatever page the user is on so the call
  // (and the excuse to leave a conversation) stays live in the background.
  if (minimized) {
    return (
      <div className="fake-call-minimized" role="button" tabIndex={0} onClick={() => setMinimized(false)}>
        <span className="fake-call-minimized-avatar">{initial}</span>
        <span className="fake-call-minimized-info">
          <strong>{callerName}</strong>
          <small>{phase === "ringing" ? t("dashboard.calling") : formatDuration(duration)}</small>
        </span>
        <button
          type="button"
          className="fake-call-minimized-hangup"
          onClick={(e) => {
            e.stopPropagation();
            hangUp();
          }}
          aria-label={t("dashboard.end_call")}
          title={t("dashboard.end_call")}
        >
          ✕
        </button>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="fake-call-overlay meet-overlay">
        <div className="meet-topbar">
          <span className="meet-topbar-title">{t("dashboard.meet_title")}</span>
          {phase === "active" && <span className="meet-topbar-duration">{formatDuration(duration)}</span>}
          <button
            type="button"
            className="meet-minimize-btn"
            onClick={() => setMinimized(true)}
            aria-label={t("dashboard.minimize_call")}
            title={t("dashboard.minimize_call")}
          >
            ⌄
          </button>
        </div>

        <div className="meet-grid">
          <div className="meet-tile">
            <div className="meet-tile-avatar">{initial}</div>
            <span className="meet-tile-label">{callerName}</span>
          </div>
          <div className="meet-tile meet-tile-self">
            <div className="meet-tile-avatar meet-tile-avatar-self">{t("dashboard.you")}</div>
            <span className="meet-tile-label">{t("dashboard.you")}</span>
          </div>
        </div>

        {phase === "ringing" ? (
          <p className="meet-status">{t("dashboard.calling")}</p>
        ) : null}

        <div className="meet-controls">
          {phase === "active" && (
            <>
              <button
                type="button"
                className={micOn ? "meet-control-btn" : "meet-control-btn off"}
                onClick={() => setMicOn((v) => !v)}
                aria-label="Toggle microphone"
                title="Toggle microphone"
              >
                🎤
              </button>
              <button
                type="button"
                className={cameraOn ? "meet-control-btn" : "meet-control-btn off"}
                onClick={() => setCameraOn((v) => !v)}
                aria-label="Toggle camera"
                title="Toggle camera"
              >
                📷
              </button>
            </>
          )}
          {phase === "ringing" ? (
            <>
              <button type="button" className="call-btn decline" onClick={hangUp}>
                {t("dashboard.decline_call")}
              </button>
              <button type="button" className="call-btn accept meet-join-btn" onClick={accept}>
                {t("dashboard.join_call")}
              </button>
            </>
          ) : (
            <button type="button" className="call-btn decline" onClick={hangUp}>
              {t("dashboard.end_call")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fake-call-overlay">
      <div className="fake-call-status-bar">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      {phase === "active" && (
        <button
          type="button"
          className="fake-call-minimize-btn"
          onClick={() => setMinimized(true)}
          aria-label={t("dashboard.minimize_call")}
          title={t("dashboard.minimize_call")}
        >
          ⌄
        </button>
      )}
      <div className="fake-call-avatar">{initial}</div>
      <h2 className="fake-call-name">{callerName}</h2>
      <p className="fake-call-subtitle">
        {phase === "ringing" ? "mobile" : formatDuration(duration)}
      </p>

      {phase === "ringing" ? (
        <div className="fake-call-actions">
          <button type="button" className="call-btn decline" onClick={hangUp}>
            ✕
          </button>
          <button type="button" className="call-btn accept" onClick={accept}>
            ✓
          </button>
        </div>
      ) : (
        <div className="fake-call-actions">
          <button type="button" className="call-btn decline" onClick={hangUp}>
            {t("dashboard.end_call")}
          </button>
        </div>
      )}
    </div>
  );
}
