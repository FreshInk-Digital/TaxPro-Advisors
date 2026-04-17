import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const translations = {
  en: {
    home: "Home",
    services: "Services",
    documentation: "Documentation",
    posters: "Posters",
    adminPortal: "Admin Portal",
  },
  sw: {
    home: "Nyumbani",
    services: "Huduma",
    documentation: "Nyaraka",
    posters: "Mabango",
    adminPortal: "Admin",
  },
  "zh-CN": {
    home: "首页",
    services: "服务",
    documentation: "文档",
    posters: "海报",
    adminPortal: "管理入口",
  },
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("app_locale") || "en";
  });

  useEffect(() => {
    localStorage.setItem("app_locale", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => {
    return (key) => translations?.[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      language: lang,
      setLang,
      t,
    }),
    [lang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);