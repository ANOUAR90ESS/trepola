import React from 'react';
import { Clock, MessageSquare, Bookmark, Share2, AlertTriangle } from 'lucide-react';
import { Article } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';
import { getOptimizedImageUrl, getSrcSet, getImageSizes } from '../utils/image';
import { getArticlePath } from '../utils/slug';
import { AdPlaceholder } from './AdPlaceholder';

interface ArticleCardProps {
  language: Language;
  article: Article;
  onSelectArticle: (article: Article) => void;
  isSaved: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onShareArticle?: (article: Article, e: React.MouseEvent) => void;
  /** When true, the cover image is eagerly loaded with high priority (use for the first, above-the-fold card to improve LCP). */
  priority?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = React.memo(({
  language,
  article,
  onSelectArticle,
  isSaved,
  onToggleBookmark,
  onShareArticle,
  priority = false,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const title = getLocalizedField(article.title, language);
  const excerpt = getLocalizedField(article.excerpt, language);
  const articlePath = getArticlePath(article, language);

  const cardImgUrl = getOptimizedImageUrl(article.imageUrl, { width: 400, format: 'webp', quality: 60 });
  const cardSrcSet = getSrcSet(article.imageUrl, [240, 320, 400, 480, 640], 60);

  const handleCardClick = (e: React.MouseEvent) => {
    // Allow normal middle-click / ctrl-click to open in new tab
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    onSelectArticle(article);
  };

  return (
    <article className="group bg-white dark:bg-slate-800/90 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5">
      <a
        href={articlePath}
        onClick={handleCardClick}
        className="block cursor-pointer flex-1"
        aria-label={title}
      >
      <div>
        {/* Aspect Ratio 16:9 Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img
            src={cardImgUrl}
            srcSet={cardSrcSet || undefined}
            sizes={getImageSizes('card')}
            alt={title}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            width={400}
            height={225}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

          {/* Top Badges */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap z-10">
            {article.isUrgent && (
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs flex items-center gap-1 animate-pulse italic">
                <AlertTriangle className="w-3 h-3" />
                !
              </span>
            )}
            <span className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
              {article.category}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={(e) => onToggleBookmark(article.id, e)}
            className="absolute top-2.5 left-2.5 p-1.5 rounded bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-transform hover:scale-110 z-10"
            title={strings.bookmark}
            aria-label={strings.bookmark}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4">
          {/* SEO / Category Tags */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400">
              #{article.category.replace(/\s+/g, '_')}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {article.publishedAt}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2 mb-3">
            {excerpt}
          </p>
          <AdPlaceholder language={language} format="horizontal" className="h-24 mt-2" />
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-3.5 sm:px-4 py-2 border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
        <div className="flex items-center gap-1.5">
          <img
            src={getOptimizedImageUrl(article.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', { width: 32, format: 'webp', quality: 60 })}
            alt={article.author?.name || 'Redacción Trepola'}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            width={16}
            height={16}
            className="w-4 h-4 rounded-full object-cover border border-slate-300 dark:border-slate-600"
          />
          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
            {article.author?.name || 'Redacción Trepola'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {article.readTimeMinutes} {strings.readTimeMinShort}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {article.commentsCount}
          </span>
          {onShareArticle && (
            <button
              onClick={(e) => onShareArticle(article, e)}
              className="p-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title={strings.share}
              aria-label={strings.share}
            >
              <Share2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      </a>
    </article>
  );
});

ArticleCard.displayName = 'ArticleCard';
