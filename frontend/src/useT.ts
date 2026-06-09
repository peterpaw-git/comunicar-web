import { useStore } from './store';
import { T } from './i18n';

/** Returns the translation object for the current language. */
export function useT() {
  const lang = useStore(s => s.lang);
  return T[lang];
}
