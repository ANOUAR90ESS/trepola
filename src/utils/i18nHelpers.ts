import { Language } from '../i18n/translations';

export function getLocalizedField(
  field: string | { es: string; en: string; ar: string } | undefined,
  lang: Language
): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.es || field.en || field.ar || '';
}
