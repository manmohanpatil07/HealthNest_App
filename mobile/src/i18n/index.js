import en from './en';
import mr from './mr';

export const translations = {
  en,
  mr,
};

/**
 * Helper to get a translation by dot notation (e.g., 'common.back')
 */
export const getTranslation = (lang = 'en', keyPath = '') => {
  const dictionary = translations[lang] || translations.en;
  if (!keyPath) return '';

  const keys = keyPath.split('.');
  let current = dictionary;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      let fallback = translations.en;
      for (const fbKey of keys) {
        if (fallback && typeof fallback === 'object' && fbKey in fallback) {
          fallback = fallback[fbKey];
        } else {
          return keyPath; // return key itself if missing everywhere
        }
      }
      return fallback;
    }
  }

  return typeof current === 'string' ? current : keyPath;
};

export default {
  translations,
  getTranslation,
};

