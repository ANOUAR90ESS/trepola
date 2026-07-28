import { Article } from '../types';
import { getLocalizedField } from './i18nHelpers';

/**
 * Generates an SEO-friendly slug string from text.
 * Handles accented characters, punctuation, spaces, and Unicode.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD') // decompose combined graphemes (e.g., "ó" -> "o" + "¨")
    .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special non-word chars
    .replace(/[\s_-]+/g, '-') // replace spaces and underscores with single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Returns the slug for an article, falling back to a generated slug from title or ID.
 */
export function getArticleSlug(article: Article, lang: 'es' | 'en' | 'ar' = 'es'): string {
  if (article.slug && article.slug.trim().length > 0) {
    return article.slug;
  }
  const titleText = getLocalizedField(article.title, lang) || getLocalizedField(article.title, 'es') || getLocalizedField(article.title, 'en') || article.id;
  const generated = slugify(titleText);
  return generated.length > 0 ? generated : article.id;
}

/**
 * Returns full relative path for an article.
 */
export function getArticlePath(article: Article, lang: 'es' | 'en' | 'ar' = 'es'): string {
  const slug = getArticleSlug(article, lang);
  return `/news/${slug}`;
}

/**
 * Returns full absolute canonical URL for an article.
 */
export function getArticleUrl(article: Article, lang: 'es' | 'en' | 'ar' = 'es'): string {
  const path = getArticlePath(article, lang);
  const baseUrl = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : (import.meta.env?.VITE_SITE_URL || 'https://www.trepola.com');
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}
