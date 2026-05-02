import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

export function useTranslation() {
  const language = useAppStore((state) => state.language);

  const t = (key: string): string | undefined => {
    const langDict = translations[language] || translations['English'];
    return langDict[key] || translations['English'][key] || undefined;
  };

  return { t, language };
}
