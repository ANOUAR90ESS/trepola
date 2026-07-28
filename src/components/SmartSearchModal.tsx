import React, { useState } from 'react';
import { Search, X, Sparkles, Newspaper, ChevronRight } from 'lucide-react';
import { Article } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';

interface SmartSearchModalProps {
  language: Language;
  articles: Article[];
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
}

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  language,
  articles,
  onClose,
  onSelectArticle,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter((art) => {
    const title = getLocalizedField(art.title, language).toLowerCase();
    const excerpt = getLocalizedField(art.excerpt, language).toLowerCase();
    const content = getLocalizedField(art.content, language).toLowerCase();
    const query = searchTerm.toLowerCase();

    return title.includes(query) || excerpt.includes(query) || content.includes(query);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto relative flex flex-col max-h-[85vh]">
        {/* Top Search Input Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder={strings.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 flex-1 space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">{strings.noArticlesFound}</p>
            </div>
          ) : (
            filteredArticles.map((art) => {
              const title = getLocalizedField(art.title, language);
              const excerpt = getLocalizedField(art.excerpt, language);
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    onSelectArticle(art);
                    onClose();
                  }}
                  className="group p-3 rounded-2xl bg-slate-50 hover:bg-rose-50/50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer flex items-center gap-3.5"
                >
                  <img
                    src={art.imageUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                      <span>{art.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-medium">📍 {art.neighborhood}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                      {title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{excerpt}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
