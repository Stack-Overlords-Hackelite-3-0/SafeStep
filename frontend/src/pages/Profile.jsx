import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateMe } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { setAppLanguage } from "../i18n";

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    preferred_language: user?.preferred_language || "en",
    fake_caller_name: user?.fake_caller_name || "Mom",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updated = await updateMe(form);
    setUser(updated);
    setAppLanguage(updated.preferred_language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <h1>{t("profile.title")}</h1>
      <form className="auth-card" onSubmit={handleSubmit} style={{ margin: 0 }}>
        <label>{t("auth.full_name")}</label>
        <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />

        <label>{t("auth.phone")}</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

        <label>{t("auth.preferred_language")}</label>
        <select
          value={form.preferred_language}
          onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
        >
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>

        <label>{t("profile.fake_caller_name")}</label>
        <input
          value={form.fake_caller_name}
          onChange={(e) => setForm({ ...form, fake_caller_name: e.target.value })}
        />

        {saved && <p className="form-success">{t("profile.saved")}</p>}
        <button type="submit" className="btn-primary">{t("profile.save")}</button>
      </form>
    </div>
  );
}
