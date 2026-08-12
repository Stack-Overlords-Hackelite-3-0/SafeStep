import { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

export default function ShareLocationModal({ shareUrl, onStopSharing, onClose }) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState("");

  const message = t("dashboard.share_message", { link: shareUrl });

  const flash = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2500);
  };

  const copyLink = async (msg) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash(msg || t("dashboard.copied"));
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the link is still
      // visible and selectable in the text field, so this fails soft.
    }
  };

  const openShareWindow = (url) => window.open(url, "_blank", "noopener,noreferrer");

  const shareWhatsApp = () => openShareWindow(`https://wa.me/?text=${encodeURIComponent(message)}`);

  const shareFacebook = () =>
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);

  // Instagram has no web share intent for arbitrary links (unlike WhatsApp/Facebook),
  // so the best we can do is copy the link for pasting into a DM or story.
  const shareInstagram = () => copyLink(t("dashboard.share_instagram_hint"));

  const shareNative = async () => {
    try {
      await navigator.share({ title: "SafeStep", text: message, url: shareUrl });
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card share-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{t("dashboard.share_title")}</h2>
        <p className="hint">{t("dashboard.share_subtitle")}</p>

        <div className="share-link-row">
          <input type="text" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn-secondary" onClick={() => copyLink()}>
            {t("dashboard.copy_link")}
          </button>
        </div>

        {feedback && <p className="share-feedback">{feedback}</p>}

        <div className="share-options">
          <button type="button" className="share-option" onClick={shareWhatsApp}>
            <span className="share-option-badge wa">WA</span>
            <span>WhatsApp</span>
          </button>
          <button type="button" className="share-option" onClick={shareFacebook}>
            <span className="share-option-badge fb">FB</span>
            <span>Facebook</span>
          </button>
          <button type="button" className="share-option" onClick={shareInstagram}>
            <span className="share-option-badge ig">IG</span>
            <span>Instagram</span>
          </button>
          <button type="button" className="share-option" onClick={() => copyLink()}>
            <span className="share-option-badge link">
              <Icon name="link" size={18} />
            </span>
            <span>{t("dashboard.copy_link")}</span>
          </button>
        </div>

        {typeof navigator !== "undefined" && navigator.share && (
          <button type="button" className="btn-secondary full-width" onClick={shareNative}>
            {t("dashboard.more_apps")}
          </button>
        )}

        <button type="button" className="btn-danger full-width" onClick={onStopSharing}>
          {t("dashboard.stop_share")}
        </button>
      </div>
    </div>
  );
}
