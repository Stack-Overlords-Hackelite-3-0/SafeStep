import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(next);
    } catch {
      setError(t("auth.login_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <Logo size={44} className="auth-logo" />
        <h1>SafeStep</h1>
        <p className="tagline">{t("tagline")}</p>
        <label>{t("auth.email")}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>{t("auth.password")}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {t("auth.login_button")}
        </button>
        <p className="auth-switch">
          <Link to="/forgot-password">{t("auth.forgot_password")}</Link>
        </p>
        <p className="auth-switch">
          {t("auth.no_account")}{" "}
          <Link to={next !== "/" ? `/register?next=${encodeURIComponent(next)}` : "/register"}>
            {t("auth.register")}
          </Link>
        </p>
      </form>
    </div>
  );
}
