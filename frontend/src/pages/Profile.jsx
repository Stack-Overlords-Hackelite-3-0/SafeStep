import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateMe } from "../api/auth";
import AvatarPicker from "../components/AvatarPicker";
import { useAuth } from "../context/AuthContext";
import { setAppLanguage } from "../i18n";
import { buildAvatarUrl } from "../utils/avatar";

export default function Profile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    preferred_language: user?.preferred_language || "en",
    fake_caller_name: user?.fake_caller_name || "Mom",
    avatar_style: user?.avatar_style || "adventurer",
    avatar_seed: user?.avatar_seed || user?.email || "",
    avatar_background: user?.avatar_background || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateAvatar = (patch) => {
    setForm((f) => ({
      ...f,
      avatar_style: patch.style ?? f.avatar_style,
      avatar_seed: patch.seed ?? f.avatar_seed,
      avatar_background: patch.background !== undefined ? patch.background : f.avatar_background,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMe(form);
      setUser(updated);
      setAppLanguage(updated.preferred_language);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page-fit">
      <div className="profile-header">
        <img
          className="profile-header-avatar"
          src={buildAvatarUrl(form.avatar_style, form.avatar_seed, form.avatar_background, 160)}
          alt=""
          width={72}
          height={72}
        />
        <div>
          <h1>{form.full_name || t("profile.title")}</h1>
          <p className="hint">{user?.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        <form className="auth-card" onSubmit={handleSubmit} style={{ margin: 0 }}>
          <h2 className="card-title">{t("profile.title")}</h2>
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
          <button type="submit" className="btn-primary" disabled={saving}>
            {t("profile.save")}
          </button>
        </form>

        <div className="profile-side">
          <div className="split-panel" style={{ position: "static" }}>
            <h2>{t("profile.avatar_title")}</h2>
            <AvatarPicker
              style={form.avatar_style}
              seed={form.avatar_seed}
              background={form.avatar_background}
              onChange={updateAvatar}
            />
          </div>

          <div className="split-panel" style={{ position: "static" }}>
            <h2>Account</h2>
            <ul className="detail-list">
              <li><span>Email</span><strong>{user?.email}</strong></li>
              <li><span>{t("auth.phone")}</span><strong>{user?.phone || "—"}</strong></li>
              <li><span>{t("auth.preferred_language")}</span><strong>{form.preferred_language.toUpperCase()}</strong></li>
            </ul>
          </div>

          <div className="split-panel" style={{ position: "static" }}>
            <h2>{t("dashboard.fake_call")}</h2>
            <p className="hint">
              When things feel unsafe, trigger a fake call from &ldquo;{form.fake_caller_name || "Mom"}&rdquo; to
              excuse yourself from a situation without drawing attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
