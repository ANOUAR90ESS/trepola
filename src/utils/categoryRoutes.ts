/**
 * Maps news category ids to indexable URL paths (and back) so each category
 * is a distinct, crawlable URL instead of a single SPA route.
 * Convention: /categoria/{id}  (matches the published sitemap).
 */

// Category ids that have their own page (must match CATEGORIES_LIST ids).
export const CATEGORY_IDS = ['general', 'tech', 'sports', 'politics', 'economy', 'culture'] as const;

/** Returns the pathname for a category id ('/' for 'all'/unknown). */
export function categoryIdToPath(id: string): string {
  if (!id || id === 'all') return '/';
  return (CATEGORY_IDS as readonly string[]).includes(id) ? `/categoria/${id}` : '/';
}

/** Returns the absolute canonical URL for a category id. */
export function categoryCanonical(id: string): string {
  return `https://www.trepola.com${categoryIdToPath(id)}`;
}

/** Parses a pathname into a category id (defaults to 'all'). */
export function pathToCategoryId(pathname: string): string {
  const parts = (pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase().split('/');
  if (parts[0] === 'categoria' && parts[1] && (CATEGORY_IDS as readonly string[]).includes(parts[1])) {
    return parts[1];
  }
  return 'all';
}

/** All category paths, for sitemap generation. */
export function allCategoryPaths(): string[] {
  return CATEGORY_IDS.map((id) => `/categoria/${id}`);
}
