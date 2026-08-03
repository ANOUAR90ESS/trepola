import React from 'react';
import { Clock, Eye, MessageSquare, Bookmark, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { Article } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';
import { getOptimizedImageUrl, getSrcSet, getImageSizes } from '../utils/image';
interface HeroFeaturedNewsProps {
  language: Language;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  savedArticleIds: string[];
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}

export const HeroFeaturedNews: React.FC<HeroFeaturedNewsProps> = ({
  language,
  articles,
  onSelectArticle,
  savedArticleIds,
  onToggleBookmark,
}) => {
  if (!articles || articles.length === 0) return null;

  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const mainArticle = articles[0];
  const sideArticles = (articles || []).slice(1, 4);

  const mainTitle = getLocalizedField(mainArticle.title, language);
  const mainExcerpt = getLocalizedField(mainArticle.excerpt, language);

  return (
    <section className="my-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-6 bg-rose-600 rounded-full" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {strings.latestNewsHeader}
          </h2>
          <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {strings.badgeText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Lead Featured Article - Google Discover Aspect Ratio (16:9) */}
        <div 
          onClick={() => onSelectArticle(mainArticle)}
          className="lg:col-span-8 group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
        >
          {/* Featured Image Box */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={getOptimizedImageUrl(mainArticle.imageUrl, { width: 1080, format: 'webp', quality: 60 })}
              srcSet={getSrcSet(mainArticle.imageUrl, [400, 640, 750, 828, 960, 1080, 1200], 60)}
              sizes="(max-width: 1024px) 100vw, 66vw"
              alt={mainTitle}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Badges Over Image */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10 flex-wrap">
              {mainArticle.isUrgent && (
                <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {strings.emergencyBannerTitle}
                </span>
              )}
              <span className="bg-rose-600/90 text-white backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {mainArticle.category}
              </span>
            </div>

            {/* Bookmark button over image */}
            <button
              onClick={(e) => onToggleBookmark(mainArticle.id, e)}
              className="absolute top-4 left-4 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-transform hover:scale-110 z-10"
              title={strings.bookmark}
              aria-label={strings.bookmark}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  savedArticleIds.includes(mainArticle.id) ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </button>

            {/* Overlay Title & Excerpt for Hero */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 text-white z-20 pointer-events-none">
              <div className="pointer-events-auto">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug sm:leading-tight mb-2.5 group-hover:text-rose-300 transition-colors">
                {mainTitle}
              </h3>
              <p className="text-slate-200 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4 font-normal max-w-3xl">
                {mainExcerpt}
              </p>

              {/* Author & Metadata Footer */}
              <div className="flex items-center justify-between text-xs text-slate-300 border-t border-white/15 pt-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <img
                    src={getOptimizedImageUrl(mainArticle.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', { width: 60, format: 'webp' })}
                    alt={mainArticle.author?.name || 'Redacción Trepola'}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-white/30"
                  />
                  <div>
                    <span className="font-bold text-white block">{mainArticle.author?.name || 'Redacción Trepola'}</span>
                    <span className="text-[10px] text-slate-400">{mainArticle.author?.role || 'Equipo Editorial'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {mainArticle.publishedAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {mainArticle.viewsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {mainArticle.commentsCount}
                  </span>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Stacked Local News Cards */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 justify-between">
          {sideArticles.map((art) => {
            const artTitle = getLocalizedField(art.title, language);
            return (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="group bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 hover:-translate-y-0.5"
                style={{ minHeight: '106px', contain: 'layout paint' }}
              >
                {/* Thumbnail 16:9 ratio */}
                <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900">
                  <img
                    src={getOptimizedImageUrl(art.imageUrl, { width: 240, format: 'webp', quality: 60 })}
                    srcSet={getSrcSet(art.imageUrl, [120, 160, 240, 320, 480], 60)}
                    sizes="(max-width: 640px) 112px, 128px"
                    alt={artTitle}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {art.isUrgent && (
                    <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      !
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                    <span>{art.category}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-2">
                    {artTitle}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.publishedAt}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
