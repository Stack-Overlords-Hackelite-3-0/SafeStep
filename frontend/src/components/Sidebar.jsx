import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { setAppLanguage } from "../i18n";
import Icon from "./Icon";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { buildAvatarUrl } from "../utils/avatar";

const NAV_ITEMS = [
  { to: "/", end: true, icon: "home", key: "dashboard" },
  { to: "/contacts", icon: "heart", key: "contacts" },
  { to: "/chatbot", icon: "chat", key: "chatbot" },
  { to: "/helpers", icon: "pin", key: "helpers" },
];

const LANGUAGES = ["en", "si", "ta"];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("safestep_sidebar_collapsed");
    if (saved !== null) return saved === "1";
    // No explicit preference yet — default to the compact icon rail on narrow
    // screens (phones, the mobile app build) instead of the full 240px sidebar.
    return typeof window !== "undefined" && window.innerWidth <= 860;
  });

  useEffect(() => {
    localStorage.setItem("safestep_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  if (!user) return null;

  const cycleLanguage = () => {
    const idx = LANGUAGES.indexOf(i18n.language);
    setAppLanguage(LANGUAGES[(idx + 1) % LANGUAGES.length]);
  };

  return (
    <nav className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar-brand">
        <Logo size={30} variant="inverse" />
        <span className="sidebar-brand-name">SafeStep</span>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>

      <NavLink to="/profile" className="sidebar-user" title={user.full_name}>
        <img
          className="sidebar-user-avatar"
          src={buildAvatarUrl(user.avatar_style, user.avatar_seed || user.email, user.avatar_background, 64)}
          alt=""
          width={36}
          height={36}
        />
        <span className="sidebar-user-name">{user.full_name}</span>
      </NavLink>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} to={item.to} end={item.end} title={t(`nav.${item.key}`)}>
            <Icon name={item.icon} size={20} className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        {collapsed ? (
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={cycleLanguage}
            aria-label="Change language"
            title="Change language"
          >
            <Icon name="globe" size={18} />
          </button>
        ) : (
          <LanguageSwitcher />
        )}
        <button
          className={collapsed ? "sidebar-icon-btn" : "btn-link"}
          onClick={logout}
          type="button"
          aria-label={t("nav.logout")}
          title={t("nav.logout")}
        >
          {collapsed ? <Icon name="logout" size={18} /> : t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
