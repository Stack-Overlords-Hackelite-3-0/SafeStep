import { useEffect, useRef, useState } from "react";

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

export default function FakeCallModal({ callerName = "Mom", onClose }) {
  const [phase, setPhase] = useState("ringing"); // ringing | active
  const [duration, setDuration] = useState(0);
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

  return (
    <div className="fake-call-overlay">
      <div className="fake-call-status-bar">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="fake-call-avatar">{callerName.charAt(0).toUpperCase()}</div>
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
            End
          </button>
        </div>
      )}
    </div>
  );
}
