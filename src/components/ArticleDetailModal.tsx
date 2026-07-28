import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Clock, 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Send, 
  ThumbsUp, 
  ShieldCheck, 
  Calendar,
  Share2,
  Copy,
  Check,
  Sparkles,
  List,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  UserCheck
} from 'lucide-react';
import { Article, Comment } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';
import { getOptimizedImageUrl, getSrcSet, getImageSizes } from '../utils/image';
import { getSocialShareLinks } from '../utils/socialShare';
import { getArticleUrl } from '../utils/slug';
import { AdPlaceholder } from './AdPlaceholder';

interface ArticleDetailModalProps {
  language: Language;
  article: Article;
  onClose: () => void;
  isSaved: boolean;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  comments?: Comment[];
  onAddComment?: (articleId: string, content: string, isResident: boolean) => void;
  allArticles?: Article[];
  onSelectArticle?: (art: Article) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  language,
  article,
  onClose,
  isSaved,
  onToggleBookmark,
  comments = [],
  onAddComment,
  allArticles = [],
  onSelectArticle,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const title = getLocalizedField(article.title, language);
  const excerpt = getLocalizedField(article.excerpt, language);
  const content = getLocalizedField(article.content, language);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [likeCount, setLikeCount] = useState(article.likesCount || 12);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle Reading Progress Percentage
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const totalScroll = scrollHeight - clientHeight;
    if (totalScroll > 0) {
      const currentProgress = Math.min(100, Math.max(0, (scrollTop / totalScroll) * 100));
      setReadingProgress(currentProgress);
    }
  };

  // Prev / Next article calculation
  const { prevArticle, nextArticle } = useMemo(() => {
    if (!allArticles || allArticles.length <= 1) return { prevArticle: null, nextArticle: null };
    const currentIndex = allArticles.findIndex((a) => a.id === article.id);
    if (currentIndex === -1) return { prevArticle: null, nextArticle: null };
    const prev = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
    const next = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;
    return { prevArticle: prev, nextArticle: next };
  }, [allArticles, article.id]);

  // Related articles (matching category & tags, excluding current)
  const relatedArticles = useMemo(() => {
    if (!allArticles || allArticles.length <= 1) return [];
    return allArticles
      .filter((a) => a.id !== article.id)
      .sort((a, b) => {
        let scoreA = a.category === article.category ? 5 : 0;
        let scoreB = b.category === article.category ? 5 : 0;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [allArticles, article]);

  // New Comment Input States
  const [commentText, setCommentText] = useState('');
  const [isResident, setIsResident] = useState(true);

  const articleComments = comments.filter((c) => c.articleId === article.id);

  const shareLinks = useMemo(() => {
    return getSocialShareLinks(article, language);
  }, [article, language]);

  const fontClasses = {
    normal: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    large: 'text-lg sm:text-xl leading-relaxed sm:leading-loose',
    xlarge: 'text-xl sm:text-2xl leading-relaxed sm:leading-loose',
  };

  const handleSpeechToggle = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToRead = `${title}. ${excerpt}. ${content}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'es-ES';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const toggleLikeArticle = () => {
    if (hasLiked) {
      setLikeCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikeCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  const handleCopyLink = () => {
    const url = getArticleUrl(article, language);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareSocial = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'telegram') => {
    const shareUrl = shareLinks[platform];
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && onAddComment) {
      onAddComment(article.id, commentText.trim(), isResident);
      setCommentText('');
    }
  };

  // Extract paragraphs for paragraph 3 AdSense insertion
  const paragraphs = useMemo(() => {
    return content.split('\n\n').filter(Boolean);
  }, [content]);

  // Extract Table of Contents sections
  const tocSections = useMemo(() => {
    return paragraphs
      .filter((p) => p.length < 80 && !p.includes('.'))
      .map((p, idx) => ({ id: `section-${idx}`, title: p }));
  }, [paragraphs]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      {/* Dynamic Toast Notification for Copy Link */}
      {copiedLink && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          {language === 'ar' ? 'تم نسخ الرابط بنجاح!' : language === 'es' ? '¡Enlace copiado al portapapeles!' : 'Link copied to clipboard!'}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto relative flex flex-col max-h-[92vh]">
        {/* Top Reading Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 z-40">
          <div
            className="bg-gradient-to-r from-rose-600 to-amber-500 h-1.5 transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <span>{language === 'es' ? 'Inicio' : language === 'ar' ? 'الرئيسية' : 'Home'}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-rose-600 dark:text-rose-400">{article.category}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{title}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Reader */}
            <button
              onClick={handleSpeechToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
              }`}
              title={strings.listenArticle}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlayingAudio ? strings.stopAudio : strings.listenArticle}</span>
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Copiar Enlace"
              aria-label="Copiar Enlace"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={(e) => onToggleBookmark(article.id, e)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title={strings.bookmark}
              aria-label={strings.bookmark}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto p-4 sm:p-8 flex-1 space-y-6">
          {/* Article Header */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {article.category}
              </span>
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {article.neighborhood}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                {article.publishedAt}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight sm:leading-tight mb-4">
              {title}
            </h1>

            {/* Author info & Metadata */}
            <div className="flex items-center justify-between border-y border-slate-200 dark:border-slate-800 py-3 text-xs text-slate-600 dark:text-slate-300 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <img
                  src={getOptimizedImageUrl(article.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', { width: 80, format: 'webp' })}
                  alt={article.author?.name || 'Redacción Trepola'}
                  loading="lazy"
                  decoding="async"
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border-2 border-rose-500"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
                    {article.author?.name || 'Redacción Trepola'}
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{article.author?.role || 'Equipo Editorial'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-500 font-medium">
                <span>⏱️ {article.readTimeMinutes} {strings.readTimeMin}</span>
                <span>👁️ {article.viewsCount}</span>
              </div>
            </div>
          </div>

          {/* Featured Hero Image (Google Discover Minimum 1200px) */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-slate-900" style={{ aspectRatio: '16 / 9', minHeight: '260px' }}>
            <img
              src={getOptimizedImageUrl(article.imageUrl, { width: 1200, format: 'webp', quality: 80 })}
              srcSet={getSrcSet(article.imageUrl, [400, 640, 900, 1200, 1600]) || undefined}
              sizes={getImageSizes('modal')}
              alt={title}
              loading="lazy"
              decoding="async"
              width={1200}
              height={675}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Key Takeaways / AI Executive Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/30 dark:border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {language === 'ar' ? 'النقاط الرئيسية (ملخص الذكاء الاصطناعي)' : language === 'es' ? 'Puntos Clave (Resumen IA)' : 'Key Takeaways (AI Summary)'}
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base leading-relaxed">
              {excerpt}
            </p>
          </div>

          {/* Table of Contents if headings exist */}
          {tocSections.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <List className="w-4 h-4 text-rose-500" />
                {language === 'ar' ? 'جدول المحتويات' : language === 'es' ? 'Tabla de Contenidos' : 'Table of Contents'}
              </h4>
              <ul className="space-y-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {tocSections.map((sec) => (
                  <li key={sec.id} className="hover:underline cursor-pointer flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>{sec.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Article Body with AdSense Unit after Paragraph 3 */}
          <div className={`text-slate-800 dark:text-slate-200 font-normal ${fontClasses[fontSize]} space-y-4`}>
            {paragraphs.map((para, index) => (
              <React.Fragment key={index}>
                <p className="leading-relaxed">{para}</p>
                {/* Paragraph 3 AdSense Placement */}
                {index === 2 && (
                  <AdPlaceholder language={language} format="in-article-p3" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Location Map Box */}
          {article.location && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <MapPin className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{article.location.addressName}</h4>
                {article.eventDate && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {article.eventDate} ({article.eventTime})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SEO Tags */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {article.seoKeywords?.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* Social Share Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
                {language === 'ar' ? 'مشاركة الخبر:' : language === 'es' ? 'Compartir:' : 'Share:'}
              </span>
              <button
                onClick={() => handleShareSocial('whatsapp')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                WhatsApp
              </button>
              <button
                onClick={() => handleShareSocial('twitter')}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                X / Twitter
              </button>
              <button
                onClick={() => handleShareSocial('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                Facebook
              </button>
              <button
                onClick={() => handleShareSocial('telegram')}
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                Telegram
              </button>
            </div>

            <button
              onClick={toggleLikeArticle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hasLiked
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`} />
              <span>{strings.liked} ({likeCount})</span>
            </button>
          </div>

          {/* Author Profile Bio Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <img
              src={getOptimizedImageUrl(article.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde', { width: 100, format: 'webp' })}
              alt={article.author?.name || 'Redacción Trepola'}
              loading="lazy"
              decoding="async"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-rose-500 shrink-0"
            />
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                {article.author?.name || 'Redacción Trepola'}
                <ShieldCheck className="w-4 h-4 text-rose-500" />
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">{article.author?.role || 'Periodista Sénior'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'صحفي متخصص في التكنولوجيا، الذكاء الاصطناعي، والأخبار المحلية. يغطي التطورات التقنية والفعاليات.'
                  : language === 'es'
                  ? 'Periodista especializado en IA, tecnología y actualidad local. Cobertura de innovación y eventos.'
                  : 'Senior journalist specializing in AI, tech developments, and local events coverage.'}
              </p>
            </div>
          </div>

          {/* Next / Previous Article Navigation Bar */}
          {(prevArticle || nextArticle) && onSelectArticle && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              {prevArticle ? (
                <button
                  onClick={() => onSelectArticle(prevArticle)}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all group flex items-center gap-3"
                >
                  <ChevronLeft className="w-5 h-5 text-rose-500 shrink-0 group-hover:-translate-x-1 transition-transform" />
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{language === 'ar' ? 'الخبر السابق' : language === 'es' ? 'Noticia Anterior' : 'Previous Story'}</span>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{getLocalizedField(prevArticle.title, language)}</h5>
                  </div>
                </button>
              ) : <div />}

              {nextArticle && (
                <button
                  onClick={() => onSelectArticle(nextArticle)}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right transition-all group flex items-center justify-end gap-3"
                >
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">{language === 'ar' ? 'الخبر التالي' : language === 'es' ? 'Siguiente Noticia' : 'Next Story'}</span>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{getLocalizedField(nextArticle.title, language)}</h5>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          )}

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && onSelectArticle && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                {language === 'ar' ? 'أخبار ذات صلة' : language === 'es' ? 'Noticias Relacionadas' : 'Related Stories'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedArticles.map((relArt) => (
                  <div
                    key={relArt.id}
                    onClick={() => onSelectArticle(relArt)}
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-900">
                      <img
                        src={getOptimizedImageUrl(relArt.imageUrl, { width: 300, format: 'webp', quality: 60 })}
                        alt={getLocalizedField(relArt.title, language)}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{relArt.category}</span>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2 mt-1 group-hover:text-rose-600 transition-colors">
                        {getLocalizedField(relArt.title, language)}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-Related Posts Ad Placement */}
          <div className="my-6">
            <AdPlaceholder language={language} format="horizontal" className="h-24 max-w-2xl mx-auto" />
          </div>

          {/* Comments Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💬</span> {strings.commentsTitle} ({articleComments.length})
            </h3>

            {/* Comment Form */}
            {onAddComment && (
              <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={strings.writeCommentPlaceholder}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all resize-none h-24"
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isResident}
                      onChange={(e) => setIsResident(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>{strings.neighborhoodResidentBadge}</span>
                  </label>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{strings.postComment}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {articleComments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  {language === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلق!' : language === 'es' ? 'No hay comentarios aún. ¡Sé el primero en opinar!' : 'No comments yet. Be the first to comment!'}
                </p>
              ) : (
                articleComments.map((comm) => (
                  <div key={comm.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                    <img
                      src={getOptimizedImageUrl(comm.authorAvatar, { width: 60, format: 'webp' })}
                      alt={comm.authorName}
                      loading="lazy"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          {comm.authorName}
                          {comm.isNeighborhoodResident && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                              📍 {article.neighborhood}
                            </span>
                          )}
                        </h5>
                        <span className="text-[10px] text-slate-400">{comm.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{comm.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
