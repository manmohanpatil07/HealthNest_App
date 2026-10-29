import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getTranslation } from '../i18n';

const LANGUAGE_KEY = 'healthnest_app_language';

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isMarathi: false,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (stored === 'mr' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (err) {
        console.warn('[LanguageContext] Failed to load stored language:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStoredLanguage();
  }, []);

  const changeLanguage = async (newLang) => {
    try {
      const validLang = newLang === 'mr' || newLang === 'Marathi' ? 'mr' : 'en';
      setLanguageState(validLang);
      await SecureStore.setItemAsync(LANGUAGE_KEY, validLang);
    } catch (err) {
      console.warn('[LanguageContext] Failed to persist language:', err);
    }
  };

  const t = (key) => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        isMarathi: language === 'mr',
        isLoaded,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;

