const HISTORY_KEY = 'trepola_reading_history';

export function getReadingHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function recordArticleRead(articleId: string): void {
  if (typeof window === 'undefined' || !articleId) return;
  try {
    const existing = getReadingHistory();
    const filtered = existing.filter((id) => id !== articleId);
    const updated = [articleId, ...filtered].slice(0, 50); // Keep last 50 read articles
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save reading history:', e);
  }
}
