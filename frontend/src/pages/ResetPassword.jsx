import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import Logo from "../components/Logo";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.password_mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || t("auth.reset_password_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Logo size={44} className="auth-logo" />
        <h1>SafeStep</h1>
        <p className="tagline">{t("auth.reset_password_title")}</p>
        {done ? (
          <p>{t("auth.reset_password_done")}</p>
        ) : (
          <>
            <label>{t("auth.new_password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <label>{t("auth.confirm_password")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting || !token}>
              {t("auth.reset_password_button")}
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
