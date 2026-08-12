import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError(t("auth.forgot_password_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Logo size={44} className="auth-logo" />
        <h1>SafeStep</h1>
        <p className="tagline">{t("auth.forgot_password_title")}</p>
        {sent ? (
          <p>{t("auth.forgot_password_sent")}</p>
        ) : (
          <>
            <label>{t("auth.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {t("auth.send_reset_link")}
            </button>
          </>
        )}
        <p className="auth-switch">
          <Link to="/login">{t("auth.back_to_login")}</Link>
        </p>
      </form>
    </div>
  );
}
