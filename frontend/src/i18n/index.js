import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import si from "./locales/si.json";
import ta from "./locales/ta.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
    ta: { translation: ta },
  },
  lng: localStorage.getItem("safestep_lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lang) {
  localStorage.setItem("safestep_lang", lang);
  i18n.changeLanguage(lang);
}

export default i18n;
