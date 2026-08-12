import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const STORAGE_POS_KEY = "safestep_mascot_pos";
// Only used for the initial default position before the element has ever been measured.
const MASCOT_WIDTH = 120;
const MASCOT_HEIGHT = 174;
const EDGE_MARGIN = 12;
const DRAG_THRESHOLD = 4; // px of movement before a pointerdown counts as a drag, not a click

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultPosition() {
  return {
    x: window.innerWidth - MASCOT_WIDTH - 24,
    y: window.innerHeight - MASCOT_HEIGHT - 24,
  };
}

export default function WelcomeMascot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [pos, setPos] = useState(null);
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

  // Greet once per login session; the mascot itself stays on screen afterward
  // until the user explicitly closes it.
  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(`safestep_mascot_dismissed_${user.id}`)) {
      setDismissed(true);
      return;
    }
    if (!sessionStorage.getItem(`safestep_welcomed_${user.id}`)) {
      sessionStorage.setItem(`safestep_welcomed_${user.id}`, "1");
      setShowBubble(true);
      const timer = setTimeout(() => setShowBubble(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const savePos = (next) => {
    setPos(next);
    localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(next));
  };

  // Deliberately NOT using setPointerCapture on the container: capturing the
  // pointer on every pointerdown (even a plain click) reroutes the browser's
  // synthesized click to the capturing element instead of whatever was
  // actually under the cursor — silently breaking clicks on the image and the
  // close button. Tracking movement via window listeners avoids that, while
  // still following the pointer outside the element's bounds during a drag.
  const handlePointerDown = (e) => {
    if (!pos) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };

    const handleMove = (moveEvent) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.moved = true;

      const rect = nodeRef.current?.getBoundingClientRect();
      const w = rect?.width || MASCOT_WIDTH;
      const h = rect?.height || MASCOT_HEIGHT;
      savePos({
        x: clamp(drag.origX + dx, EDGE_MARGIN, window.innerWidth - w - EDGE_MARGIN),
        y: clamp(drag.origY + dy, EDGE_MARGIN, window.innerHeight - h - EDGE_MARGIN),
      });
    };

    const handleUp = () => {
      dragRef.current.active = false;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      cleanupRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    cleanupRef.current = handleUp;
  };

  const handleImgClick = () => {
    if (dragRef.current.moved) return; // a drag just ended — don't also toggle the bubble
    setShowBubble((v) => !v);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (dragRef.current.moved) return;
    setDismissed(true);
    if (user) sessionStorage.setItem(`safestep_mascot_dismissed_${user.id}`, "1");
  };

  if (!user || dismissed || !pos) return null;

  return (
    <div ref={nodeRef} className="mascot-buddy" style={{ left: pos.x, top: pos.y }} onPointerDown={handlePointerDown}>
      <div className="mascot-avatar">
        <button type="button" className="mascot-close" onClick={handleClose} aria-label="Dismiss">
          ✕
        </button>
        <img src="/HI.png" alt="" className="mascot-toast-img" draggable={false} onClick={handleImgClick} />
        {showBubble && (
          <div className="mascot-bubble">
            <strong>{t("mascot.hi", { name: user.full_name?.split(" ")[0] || "" })}</strong>
            <p>{t("mascot.hi_sub")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
