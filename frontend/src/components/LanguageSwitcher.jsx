import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../i18n";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "si", label: "සිං" },
  { code: "ta", label: "தமிழ்" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="language-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={i18n.language === lang.code ? "lang-btn active" : "lang-btn"}
          onClick={() => setAppLanguage(lang.code)}
          type="button"
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
