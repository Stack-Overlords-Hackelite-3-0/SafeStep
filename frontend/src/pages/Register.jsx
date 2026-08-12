import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    preferred_language: "en",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError(t("auth.password_mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const { confirm_password, ...payload } = form;
      await register(payload);
      navigate(next);
    } catch (err) {
      setError(err.response?.data?.detail || t("auth.register_failed"));
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
        <label>{t("auth.full_name")}</label>
        <input value={form.full_name} onChange={update("full_name")} required />
        <label>{t("auth.email")}</label>
        <input type="email" value={form.email} onChange={update("email")} required />
        <label>{t("auth.password")}</label>
        <input
          type="password"
          value={form.password}
          onChange={update("password")}
          minLength={8}
          required
        />
        <label>{t("auth.confirm_password")}</label>
        <input
          type="password"
          value={form.confirm_password}
          onChange={update("confirm_password")}
          minLength={8}
          required
        />
        <label>{t("auth.phone")}</label>
        <input value={form.phone} onChange={update("phone")} />
        <label>{t("auth.preferred_language")}</label>
        <select value={form.preferred_language} onChange={update("preferred_language")}>
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {t("auth.register_button")}
        </button>
        <p className="auth-switch">
          {t("auth.have_account")}{" "}
          <Link to={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"}>{t("auth.login")}</Link>
        </p>
      </form>
    </div>
  );
}
