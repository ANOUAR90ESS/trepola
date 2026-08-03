import React from 'react';
import { X, Bookmark, Trash2, Newspaper } from 'lucide-react';
import { Article } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';

interface BookmarksDrawerProps {
  language: Language;
  savedArticles: Article[];
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
  onRemoveBookmark: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  language,
  savedArticles,
  onClose,
  onSelectArticle,
  onRemoveBookmark,
  onClearAll,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-slide-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{strings.savedArticlesTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">({savedArticles.length})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {savedArticles.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">{strings.noSavedArticles}</p>
            </div>
          ) : (
            savedArticles.map((art) => {
              const title = getLocalizedField(art.title, language);
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    onSelectArticle(art);
                    onClose();
                  }}
                  className="group p-3 rounded-2xl bg-slate-50 hover:bg-rose-50/50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer flex items-center gap-3"
                >
                  <img
                    src={art.imageUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                      {art.category}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                      {title}
                    </h4>
                  </div>

                  <button
                    onClick={(e) => onRemoveBookmark(art.id, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {savedArticles.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total: {savedArticles.length}</span>
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
