import React, { useState, useEffect, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { HeroFeaturedNews } from './components/HeroFeaturedNews';
import { ArticleCard } from './components/ArticleCard';
import { AdPlaceholder } from './components/AdPlaceholder';
import { Footer } from './components/Footer';
import { SEOHead } from './components/SEOHead';
import { BackToTop } from './components/BackToTop';
import { PrivacyCookieBanner } from './components/PrivacyCookieBanner';

// Lazy Loaded Modals for Mobile Bundle Splitting & Zero Main-Thread Blocking
const ArticleDetailModal = React.lazy(() => import('./components/ArticleDetailModal').then(m => ({ default: m.ArticleDetailModal })));
const SmartSearchModal = React.lazy(() => import('./components/SmartSearchModal').then(m => ({ default: m.SmartSearchModal })));
const BookmarksDrawer = React.lazy(() => import('./components/BookmarksDrawer').then(m => ({ default: m.BookmarksDrawer })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SEOViewerModal = React.lazy(() => import('./components/SEOViewerModal').then(m => ({ default: m.SEOViewerModal })));
const FooterPageModal = React.lazy(() => import('./components/FooterPageModal').then(m => ({ default: m.FooterPageModal })));
const AdminLoginModal = React.lazy(() => import('./components/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));
const InteractiveLocalMap = React.lazy(() => import('./components/InteractiveLocalMap').then(m => ({ default: m.InteractiveLocalMap })));

import { useAuth } from './lib/auth-context.tsx';
import { INITIAL_ARTICLES, INITIAL_EVENTS, INITIAL_ALERTS, INITIAL_COMMENTS } from './data/initialData';
import { Article, CommunityEvent, EmergencyAlert, Comment } from './types';
import { Language, UI_STRINGS, CITIES_DATA } from './i18n/translations';
import { getLocalizedField } from './utils/i18nHelpers';
import { pathToCategoryId, categoryIdToPath } from './utils/categoryRoutes';
import { getArticlePath, getArticleSlug, slugify } from './utils/slug';
import { recordArticleRead } from './utils/readingHistory';

import { Newspaper, Flame, TrendingUp, Bell, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  // --- Core Application States ---
  const [language, setLanguage] = useState<Language>('es');
  const [selectedCityId, setSelectedCityId] = useState<string>('madrid');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(() =>
    typeof window !== 'undefined' ? pathToCategoryId(window.location.pathname) : 'all'
  );

  // Change category, reflecting it in the URL so each section is indexable.
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setActiveTab('feed');
    if (typeof window !== 'undefined') {
      const path = categoryIdToPath(catId);
      if (window.location.pathname !== path) {
        window.history.pushState({ category: catId }, '', path);
      }
    }
  };

  // Keep category in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => setSelectedCategory(pathToCategoryId(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('nabd_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  const [events, setEvents] = useState<CommunityEvent[]>(INITIAL_EVENTS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('nabd_comments');
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('nabd_saved_ids');
    return saved ? JSON.parse(saved) : ['art-1'];
  });

    const { user, token } = useAuth();
  
  // Safe JSON Fetch helper to prevent HTML 500 JSON parse crashes
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Defer initial comments fetch so initial HTML and LCP render immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      safeFetchJson('/api/comments').then(data => {
        if (data && Array.isArray(data)) setComments(data);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  // Fetch saved articles when user changes
  useEffect(() => {
    if (user && token) {
      const timer = setTimeout(() => {
        safeFetchJson('/api/saved-articles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(data => {
          if (data && Array.isArray(data)) setSavedArticleIds(data);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, token]);

  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'saved' | 'admin'>('feed');

  const isAdminAuthenticated = user?.role === 'admin';

  useEffect(() => {
    if (isAdminAuthenticated) {
      setActiveTab('admin');
    } else {
      setActiveTab(prev => prev === 'admin' ? 'feed' : prev);
    }
  }, [isAdminAuthenticated]);

  // Modals & Overlays
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedSEOArticle, setSelectedSEOArticle] = useState<Article | null>(null);
  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const [isOpenAlerts, setIsOpenAlerts] = useState(false);
  const [activeFooterPage, setActiveFooterPage] = useState<'terms' | 'privacy' | 'about' | 'cookie' | 'security' | 'contact' | null>(null);

  // Open article modal & push URL state
  const handleOpenArticle = (art: Article) => {
    setSelectedArticle(art);
    recordArticleRead(art.id);
    if (typeof window !== 'undefined') {
      const artPath = getArticlePath(art, language);
      if (window.location.pathname !== artPath) {
        window.history.pushState({ articleId: art.id, slug: art.slug }, '', artPath);
      }
    }
  };

  // Close article modal & revert URL state
  const handleCloseArticle = () => {
    setSelectedArticle(null);
    if (typeof window !== 'undefined') {
      const fallbackPath = categoryIdToPath(selectedCategory);
      if (window.location.pathname.startsWith('/news/')) {
        window.history.pushState({}, '', fallbackPath);
      }
    }
  };

  // Synchronize article or page on initial load or popstate (e.g. /news/:slug, /terms, /privacy)
  useEffect(() => {
    const parseUrlRoute = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname.toLowerCase();

      // Check footer pages (e.g. /terms, /privacy)
      const pageMatch = pathname.match(/^\/(terms|privacy|about|cookie|security|contact)/);
      if (pageMatch) {
        setActiveFooterPage(pageMatch[1] as any);
        return;
      }

      // Check news articles
      const match = pathname.match(/^\/news\/([^\/]+)/);
      if (match) {
        const slugOrId = decodeURIComponent(match[1]).trim();
        const found = articles.find(
          (a) => a.id === slugOrId || a.slug === slugOrId || slugify(getLocalizedField(a.title, 'es')) === slugOrId
        );
        if (found) {
          setSelectedArticle(found);
          recordArticleRead(found.id);
        }
      }
    };
    parseUrlRoute();

    const handlePop = () => {
      parseUrlRoute();
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [articles]);

  // Dark Mode Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('nabd_theme') === 'dark';
  });

  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const currentCity = CITIES_DATA.find((c) => c.id === selectedCityId) || CITIES_DATA[0];

  // Tab change guard
  const handleTabChange = (tab: 'feed' | 'map' | 'saved' | 'admin') => {
    if (tab === 'admin' && !isAdminAuthenticated) return;
    setActiveTab(tab);
  };



  // Persist State Updates
  useEffect(() => {
    localStorage.setItem('nabd_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('nabd_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('nabd_saved_ids', JSON.stringify(savedArticleIds));
  }, [savedArticleIds]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nabd_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nabd_theme', 'light');
    }
  }, [darkMode]);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpenSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  
  const handleToggleBookmark = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const isCurrentlySaved = savedArticleIds.includes(id);
    // Optimistic UI
    setSavedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    
    if (user && token) {
      try {
        if (isCurrentlySaved) {
          await fetch(`/api/saved-articles/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } else {
          await fetch('/api/saved-articles', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ articleId: id })
          });
        }
      } catch (e) {
        console.error('Failed to toggle bookmark on server', e);
      }
    }
  };

  
  const handleAddComment = async (articleId: string, text: string, name: string, isResident: boolean) => {
    if (user && token) {
      try {
        await fetch('/api/comments', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ articleId, content: text, isResident })
        });
        
        // Refresh comments
        const freshData = await safeFetchJson('/api/comments');
        if (freshData && Array.isArray(freshData)) {
          setComments(freshData);
        }
        
        setArticles((prev) =>
          prev.map((art) => (art.id === articleId ? { ...art, commentsCount: art.commentsCount + 1 } : art))
        );
      } catch (e) {
        console.error('Failed to post comment', e);
      }
    } else {
      alert("Please log in to comment.");
    }
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
    );
  };

  // Sync articles from Supabase database
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.from('articles').select('*').order('published_at', { ascending: false }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const dbFormatted: Article[] = data.map((art: any) => ({
            id: art.id,
            title: art.title,
            excerpt: art.excerpt,
            content: art.content,
            category: art.category,
            neighborhood: art.neighborhood,
            imageUrl: art.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=70',
            publishedAt: art.published_at ? new Date(art.published_at).toLocaleDateString() : (language === 'es' ? 'Hoy' : language === 'ar' ? 'اليوم' : 'Today'),
            source: art.source || 'Redacción Trepola',
            author: {
              name: art.source || 'Redacción Trepola',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60',
              role: 'Equipo Editorial',
            },
            readTimeMinutes: art.read_time_minutes || 3,
            seoKeywords: art.seo_keywords || [],
            metaDescription: art.meta_description || '',
            isUrgent: art.is_urgent || false,
            likesCount: 12,
            viewsCount: 150,
            commentsCount: 0,
          }));

          setArticles((prev) => {
            const existingIds = new Set(dbFormatted.map((a) => a.id));
            const remainingLocal = prev.filter((a) => !existingIds.has(a.id));
            return [...dbFormatted, ...remainingLocal];
          });
        }
      });
    }
  }, []);

  const handleAddArticle = async (newArticle: Article) => {
    setArticles((prev) => [newArticle, ...prev]);

    if (!token) return;
    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newArticle),
      });
    } catch (e) {
      console.warn('Could not save article to backend DB:', e);
    }
  };

  const handleUpdateArticle = async (updatedArticle: Article) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === updatedArticle.id ? updatedArticle : art))
    );

    if (!token) return;
    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedArticle),
      });
    } catch (e) {
      console.warn('Could not update article in backend DB:', e);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    setArticles((prev) => prev.filter((art) => art.id !== id));

    if (!token) return;
    try {
      await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Could not delete article from backend DB:', e);
    }
  };

  // Filtered Articles for Main Feed
  const filteredArticles = articles.filter((art) => {
    const matchesCity = !art.cityId || art.cityId === selectedCityId;
    const matchesDistrict = selectedDistrictId === 'all' || art.districtId === selectedDistrictId;
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    return matchesCity && matchesDistrict && matchesCategory;
  });

  const savedArticles = articles.filter((a) => savedArticleIds.includes(a.id));

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200 ${language === 'ar' ? 'font-[\'Cairo\',sans-serif]' : 'font-sans'}`}>
      <SEOHead
        language={language}
        activeTab={activeTab}
        selectedCategory={selectedCategory}
        selectedArticle={selectedArticle}
      />
      {/* Main Header & Navbar */}
      <Navbar
        language={language}
        onSelectLanguage={setLanguage}
        selectedCityId={selectedCityId}
        onSelectCity={(cityId) => {
          setSelectedCityId(cityId);
          setSelectedDistrictId('all');
        }}
        selectedDistrictId={selectedDistrictId}
        onSelectDistrict={setSelectedDistrictId}
        currentCategoryId={selectedCategory}
        onSelectCategory={handleSelectCategory}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        savedCount={savedArticleIds.length}
        onOpenSearch={() => setIsOpenSearch(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="sr-only">{strings.appName} — {strings.tagline}</h1>
        {/* --- TAB: FEED --- */}
        {activeTab === 'feed' && (
          <div className="space-y-8 animate-fade-in">
            {/* Breaking News Ticker Bar */}
            {articles.length > 0 && (
              <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-2.5 px-4 shadow-md flex items-center gap-3 overflow-hidden text-xs font-bold">
                <div className="flex items-center gap-1.5 shrink-0 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] uppercase tracking-wider animate-pulse">
                  <Bell className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'عاجل' : language === 'es' ? 'Última Hora' : 'Breaking'}</span>
                </div>
                <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <div
                    onClick={() => handleOpenArticle(articles[0])}
                    className="inline-block cursor-pointer hover:underline truncate max-w-full"
                  >
                    {getLocalizedField(articles[0].title, language)}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenArticle(articles[0])}
                  className="shrink-0 text-[11px] font-black underline flex items-center gap-1 opacity-90 hover:opacity-100"
                >
                  <span>{language === 'ar' ? 'اقرأ المزيد' : language === 'es' ? 'Leer más' : 'Read more'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Featured Hero Section */}
            {filteredArticles.length > 0 && (
              <HeroFeaturedNews
                language={language}
                articles={filteredArticles}
                onSelectArticle={handleOpenArticle}
                savedArticleIds={savedArticleIds}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {/* Main Articles Magazine Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-6 bg-red-600 rounded-full" />
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {strings.latestNewsHeader}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                    {filteredArticles.length} {strings.articlesCount}
                  </span>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="space-y-6">
                  <div className="text-center py-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Newspaper className="w-12 h-12 mx-auto mb-2 text-slate-400 opacity-50" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {strings.noArticlesFound}
                    </p>
                    <button
                      onClick={() => {
                        handleSelectCategory('all');
                        setSelectedDistrictId('all');
                      }}
                      className="mt-3 text-xs bg-red-600 text-white font-bold px-4 py-2 rounded-xl"
                    >
                      {strings.resetFilters}
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {language === 'ar' ? 'مقالات موصى بها' : language === 'es' ? 'Artículos recomendados' : 'Recommended Articles'}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Sponsored
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {articles.slice(0, 2).map((art) => (
                        <ArticleCard
                          key={art.id}
                          language={language}
                          article={art}
                          onSelectArticle={handleOpenArticle}
                          isSaved={savedArticleIds.includes(art.id)}
                          onToggleBookmark={handleToggleBookmark}
                        />
                      ))}
                      <AdPlaceholder language={language} format="rectangle" className="w-full h-full min-h-[300px]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
                  key={`grid-${selectedCategory}-${selectedDistrictId}`}
                >
                  {filteredArticles.map((art, index) => (
                    <React.Fragment key={art.id}>
                      <div className="flex flex-col">
                        <ArticleCard
                          language={language}
                          article={art}
                          onSelectArticle={handleOpenArticle}
                          isSaved={savedArticleIds.includes(art.id)}
                          onToggleBookmark={handleToggleBookmark}
                          priority={index === 0}
                        />
                      </div>
                      {(index + 1) % 4 === 0 && (
                        <div className="flex flex-col">
                          <AdPlaceholder language={language} format="rectangle" className="w-full h-full min-h-[300px]" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- TAB: INTERACTIVE MAP --- */}
        {activeTab === 'map' && (
          <div className="animate-fade-in">
            <Suspense fallback={<div className="w-full h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-bold">Cargando mapa...</div>}>
              <InteractiveLocalMap
                language={language}
                articles={articles}
                onSelectArticle={handleOpenArticle}
                selectedCityId={selectedCityId}
              />
            </Suspense>
          </div>
        )}

        {/* --- TAB: SAVED ARTICLES --- */}
        {activeTab === 'saved' && (
          <div className="animate-fade-in space-y-6">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{strings.savedArticlesTitle}</h2>
              </div>
              <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold px-3 py-1 rounded-full">
                {savedArticles.length}
              </span>
            </div>

            {savedArticles.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <Newspaper className="w-12 h-12 mx-auto mb-2 text-slate-400 opacity-50" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {strings.noSavedArticles}
                  </p>
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="mt-3 text-xs bg-rose-600 text-white font-bold px-4 py-2 rounded-xl"
                  >
                    {strings.latestLocalNews}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {language === 'ar' ? 'مقالات موصى بها' : language === 'es' ? 'Artículos recomendados' : 'Recommended Articles'}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Sponsored
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.slice(0, 2).map((art) => (
                      <ArticleCard
                        key={art.id}
                        language={language}
                        article={art}
                        onSelectArticle={handleOpenArticle}
                        isSaved={savedArticleIds.includes(art.id)}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    ))}
                    <AdPlaceholder language={language} format="rectangle" className="w-full h-full min-h-[300px]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedArticles.map((art, index) => (
                  <React.Fragment key={art.id}>
                    <ArticleCard
                      language={language}
                      article={art}
                      onSelectArticle={handleOpenArticle}
                      isSaved={true}
                      onToggleBookmark={handleToggleBookmark}
                    />
                    {(index + 1) % 4 === 0 && (
                      <AdPlaceholder language={language} format="rectangle" className="w-full h-full min-h-[300px]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: ADMIN DASHBOARD --- */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="animate-fade-in">
            <Suspense fallback={null}>
              <AdminDashboard
                language={language}
                articles={articles}
                comments={comments}
                onAddArticle={handleAddArticle}
                onUpdateArticle={handleUpdateArticle}
                onDeleteArticle={handleDeleteArticle}
                onReorderArticles={(newOrder) => setArticles(newOrder)}
                cityName={currentCity.name[language]}
              />
            </Suspense>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        language={language}
        selectedCityId={selectedCityId}
        onOpenAlerts={() => setIsOpenAlerts(true)}
        onOpenPage={setActiveFooterPage}
        onOpenAdminLogin={() => setShowAdminLoginModal(true)}
      />

      {/* Modal overlays */}
      <PrivacyCookieBanner 
        language={language}
        onOpenPrivacyPage={() => setActiveFooterPage('privacy')}
      />
      <Suspense fallback={null}>
        {activeFooterPage && (
          <FooterPageModal
            pageId={activeFooterPage}
            language={language}
            onClose={() => setActiveFooterPage(null)}
          />
        )}

        {selectedArticle && (
          <ArticleDetailModal
            language={language}
            article={selectedArticle}
            onClose={handleCloseArticle}
            isSaved={savedArticleIds.includes(selectedArticle.id)}
            onToggleBookmark={handleToggleBookmark}
            comments={comments}
            onAddComment={handleAddComment}
            allArticles={articles}
            onSelectArticle={handleOpenArticle}
          />
        )}

        {selectedSEOArticle && (
          <SEOViewerModal
            language={language}
            article={selectedSEOArticle}
            onClose={() => setSelectedSEOArticle(null)}
          />
        )}

        {isOpenSearch && (
          <SmartSearchModal
            language={language}
            articles={articles}
            onClose={() => setIsOpenSearch(false)}
            onSelectArticle={(art) => handleOpenArticle(art)}
          />
        )}

        {activeTab === 'saved' && (
          <BookmarksDrawer
            language={language}
            savedArticles={savedArticles}
            onClose={() => setActiveTab('feed')}
            onSelectArticle={(art) => handleOpenArticle(art)}
            onRemoveBookmark={handleToggleBookmark}
            onClearAll={() => setSavedArticleIds([])}
          />
        )}
        {showAdminLoginModal && (
          <AdminLoginModal 
            onClose={() => setShowAdminLoginModal(false)} 
            onSuccess={() => setActiveTab('admin')} 
          />
        )}
      </Suspense>

      {/* Floating Back To Top Button & Sticky Mobile Ad Banner */}
      <BackToTop />
      <AdPlaceholder language={language} format="sticky-footer" />
    </div>
  );
}
