import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Language, type TranslationKeys } from './translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language') as Language;
    return saved && translations[saved] ? saved : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  }, []);

  const t = useCallback((key: keyof TranslationKeys, vars?: Record<string, string>): string => {
    let text = (translations[language] as any)?.[key] || (translations['en'] as any)?.[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
