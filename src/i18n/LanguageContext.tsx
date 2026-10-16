import { createContext, useContext, useState, useCallback, ReactNode, Context } from "react";
import { translations, Language, TranslationKeys } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

// Keep the same context identity when live preview updates this module.
// Existing providers must remain visible to refreshed consumers.
const LanguageContext: Context<LanguageContextType | undefined> =
  import.meta.hot?.data.languageContext ?? createContext<LanguageContextType | undefined>(undefined);
if (import.meta.hot) {
  import.meta.hot.data.languageContext = LanguageContext;
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage for saved preference, default to French
    const saved = localStorage.getItem("language") as Language;
    return saved && (saved === "fr" || saved === "en") ? saved : "fr";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
