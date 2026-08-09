import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">SafeStep</div>
      <div className="navbar-links">
        <NavLink to="/" end>{t("nav.dashboard")}</NavLink>
        <NavLink to="/contacts">{t("nav.contacts")}</NavLink>
        <NavLink to="/chatbot">{t("nav.chatbot")}</NavLink>
        <NavLink to="/helpers">{t("nav.helpers")}</NavLink>
        <NavLink to="/routes">{t("nav.routes")}</NavLink>
        <NavLink to="/checkins">{t("nav.checkins")}</NavLink>
        <NavLink to="/profile">{t("nav.profile")}</NavLink>
      </div>
      <div className="navbar-actions">
        <LanguageSwitcher />
        <button className="btn-link" onClick={logout} type="button">
          {t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
