import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Lang } from "./translations";

interface I18nCtx {
  lang: Lang;
  toggleLang: () => void;
  t: (section: string, key: string) => string;
}

const I18nContext = createContext<I18nCtx>({
  lang: "es",
  toggleLang: () => {},
  t: () => "",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("monglipool-lang");
    if (saved === "en" || saved === "es") return saved;
    return navigator.language.startsWith("en") ? "en" : "es";
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "es" ? "en" : "es";
      localStorage.setItem("monglipool-lang", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (section: string, key: string): string => {
      const sec = (translations as Record<string, Record<string, Record<Lang, string>>>)[section];
      if (!sec) return `${section}.${key}`;
      const entry = sec[key];
      if (!entry) return `${section}.${key}`;
      return entry[lang] ?? entry["es"] ?? `${section}.${key}`;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}