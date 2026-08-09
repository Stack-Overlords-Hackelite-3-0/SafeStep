import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";

const NAV_ITEMS = [
  { to: "/", end: true, icon: "home", key: "dashboard" },
  { to: "/contacts", icon: "heart", key: "contacts" },
  { to: "/chatbot", icon: "chat", key: "chatbot" },
  { to: "/helpers", icon: "pin", key: "helpers" },
  { to: "/routes", icon: "route", key: "routes" },
  { to: "/checkins", icon: "checkin", key: "checkins" },
  { to: "/profile", icon: "person", key: "profile" },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <Logo size={30} variant="inverse" />
        <span>SafeStep</span>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} to={item.to} end={item.end}>
            <Icon name={item.icon} size={20} className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <LanguageSwitcher />
        <button className="btn-link" onClick={logout} type="button">
          {t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
