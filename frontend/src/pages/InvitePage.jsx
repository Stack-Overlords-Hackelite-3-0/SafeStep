import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { acceptInviteByToken, declineInviteByToken, getInvitePreview } from "../api/contacts";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function InvitePage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const { user } = useAuth();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState(null); // "accepted" | "declined"

  useEffect(() => {
    getInvitePreview(token)
      .then(setPreview)
      .catch(() => setError(t("invite.not_found")));
  }, [token, t]);

  const handleAccept = async () => {
    setActing(true);
    try {
      await acceptInviteByToken(token);
      setResult("accepted");
    } catch {
      setError(t("invite.not_found"));
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      await declineInviteByToken(token);
      setResult("declined");
    } catch {
      setError(t("invite.not_found"));
    } finally {
      setActing(false);
    }
  };

  const next = `/invite/${token}`;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo size={44} className="auth-logo" />
        <h1>SafeStep</h1>

        {error && <p className="form-error">{error}</p>}

        {!error && !preview && <p className="hint">{t("invite.loading")}</p>}

        {!error && preview && (
          <>
            {result === "accepted" || preview.status === "accepted" ? (
              <>
                <p>{t("invite.accepted_message", { name: preview.inviter_name })}</p>
                {user && (
                  <Link to="/" className="btn-primary full-width">
                    {t("invite.go_to_dashboard")}
                  </Link>
                )}
              </>
            ) : result === "declined" || preview.status === "declined" ? (
              <p>{t("invite.declined_message")}</p>
            ) : (
              <>
                <p>{t("invite.message", { name: preview.inviter_name })}</p>
                <p className="hint">{t("invite.subtitle")}</p>

                {user ? (
                  <div className="form-row">
                    <button type="button" className="btn-primary" onClick={handleAccept} disabled={acting}>
                      {t("invite.accept")}
                    </button>
                    <button type="button" className="btn-danger" onClick={handleDecline} disabled={acting}>
                      {t("invite.decline")}
                    </button>
                  </div>
                ) : (
                  <>
                    <Link to={`/login?next=${encodeURIComponent(next)}`} className="btn-primary full-width">
                      {t("invite.login_to_accept")}
                    </Link>
                    <Link to={`/register?next=${encodeURIComponent(next)}`} className="btn-secondary full-width">
                      {t("invite.create_account")}
                    </Link>
                    <p className="hint">{t("invite.decline_no_account")}</p>
                    <button type="button" className="btn-danger full-width" onClick={handleDecline} disabled={acting}>
                      {t("invite.decline")}
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
