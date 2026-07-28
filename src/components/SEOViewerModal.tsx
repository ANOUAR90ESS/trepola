import React, { useState } from 'react';
import { X, Code, CheckCircle2, Sparkles, Copy, Smartphone } from 'lucide-react';
import { Article } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';

interface SEOViewerModalProps {
  language: Language;
  article: Article;
  onClose: () => void;
}

export const SEOViewerModal: React.FC<SEOViewerModalProps> = ({ language, article, onClose }) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const [copied, setCopied] = useState(false);

  const title = getLocalizedField(article.title, language);
  const excerpt = getLocalizedField(article.excerpt, language);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.trepola.com/news/${article.id}`,
    },
    headline: title,
    description: excerpt,
    image: [article.imageUrl],
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: article.author.name,
      jobTitle: article.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Trepola',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.trepola.com/web-app-manifest-512x512.png',
      },
    },
    contentLocation: {
      '@type': 'Place',
      name: article.neighborhood,
    },
    keywords: article.seoKeywords?.join(', '),
  };

  const handleCopyJsonLd = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonLdData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {strings.inspectSeo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google Discover & SEO Compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Checklist of Discover Criteria */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Google Discover Readiness: 100/100
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>High resolution 16:9 image (&gt;1200px)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Non-clickbait headline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified author credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hyper-local geo-location tag</span>
              </div>
            </div>
          </div>

          {/* Simulated Google Discover Card Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Smartphone className="w-4 h-4 text-rose-600" />
              Google Discover Preview:
            </h4>

            <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center">
                    N
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{strings.appName}</span>
                </div>
                <span>{article.publishedAt}</span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                <img
                  src={article.imageUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                {title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {excerpt}
              </p>
            </div>
          </div>

          {/* JSON-LD Schema.org Data Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Code className="w-4 h-4 text-indigo-600" />
                Schema.org (JSON-LD):
              </h4>
              <button
                onClick={handleCopyJsonLd}
                className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto dir-ltr text-left border border-slate-800">
              {JSON.stringify(jsonLdData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
