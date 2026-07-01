import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
] as const;

const STORAGE_KEY = 'kc_lang';
const initial = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es }, pt: { translation: pt } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(code: string) {
  i18n.changeLanguage(code);
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
}

export default i18n;
