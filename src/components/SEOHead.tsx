import React, { useEffect } from 'react';
import { Article } from '../types';
import { Language } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';
import { getOptimizedImageUrl } from '../utils/image';
import { categoryCanonical } from '../utils/categoryRoutes';
import { getArticleUrl } from '../utils/slug';

interface SEOHeadProps {
  language: Language;
  activeTab?: 'feed' | 'map' | 'saved' | 'admin';
  selectedCategory?: string;
  selectedArticle?: Article | null;
  searchQuery?: string;
  activeFooterPage?: 'terms' | 'privacy' | 'about' | 'cookie' | 'security' | 'contact' | null;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  language,
  activeTab = 'feed',
  selectedCategory = 'all',
  selectedArticle = null,
  searchQuery = '',
  activeFooterPage = null,
}) => {
  useEffect(() => {
    let title = 'Trepola | AI News, Technology, Sports & Local News';
    let description =
      'Read the latest AI news, technology, sports, business and local events. Trepola delivers fast, reliable and up-to-date stories every day.';
    let imageUrl = 'https://www.trepola.com/web-app-manifest-512x512.png';
    let canonicalUrl = 'https://www.trepola.com/';
    let jsonLd: any = null;

    // Keep these in sync with FOOTER_PAGES in server.ts — the server sets the
    // same values into the HTML, and without this branch the effect would
    // reset the title/canonical back to the home page's on every footer page.
    const FOOTER_PAGE_META: Record<string, { title: string; description: string; path: string }> = {
      about: {
        title: 'Sobre Trepola | Quiénes somos',
        description: 'Conoce Trepola: nuestra misión, nuestra visión y cómo cubrimos la actualidad en tecnología, IA, deportes, economía y cultura.',
        path: '/about',
      },
      contact: {
        title: 'Contacto | Trepola',
        description: 'Ponte en contacto con el equipo de Trepola para consultas editoriales, correcciones, colaboraciones o cuestiones de publicidad.',
        path: '/contact',
      },
      privacy: {
        title: 'Política de Privacidad | Trepola',
        description: 'Cómo Trepola recoge, usa y protege tus datos personales, incluidas cookies, analítica y servicios publicitarios de terceros.',
        path: '/privacy',
      },
      terms: {
        title: 'Términos de Servicio | Trepola',
        description: 'Condiciones de uso de Trepola: derechos, responsabilidades, propiedad intelectual y normas de acceso al sitio.',
        path: '/terms',
      },
      cookie: {
        title: 'Política de Cookies | Trepola',
        description: 'Qué cookies utiliza Trepola, para qué sirven y cómo puedes gestionarlas o desactivarlas desde tu navegador.',
        path: '/cookie',
      },
      security: {
        title: 'Seguridad | Trepola',
        description: 'Medidas de seguridad de Trepola para proteger la información de los usuarios y la integridad del sitio.',
        path: '/security',
      },
    };

    if (activeFooterPage && FOOTER_PAGE_META[activeFooterPage]) {
      const page = FOOTER_PAGE_META[activeFooterPage];
      title = page.title;
      description = page.description;
      canonicalUrl = `https://www.trepola.com${page.path}`;
    } else if (selectedArticle) {
      const artTitle = getLocalizedField(selectedArticle.title, language);
      const artExcerpt = getLocalizedField(selectedArticle.excerpt, language);
      
      title = `${artTitle} | Trepola`;
      description = artExcerpt.length > 155 ? artExcerpt.substring(0, 152) + '...' : artExcerpt;
      imageUrl = getOptimizedImageUrl(selectedArticle.imageUrl, { width: 1200, format: 'webp', quality: 80 });
      canonicalUrl = getArticleUrl(selectedArticle, language);

      // Generate NewsArticle & Breadcrumb Schema for Google Discover & News
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'NewsArticle',
            '@id': `${canonicalUrl}#article`,
            'isPartOf': { '@id': 'https://www.trepola.com/#website' },
            'headline': artTitle,
            'description': description,
            'mainEntityOfPage': {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
            'image': [imageUrl],
            'datePublished': selectedArticle.publishedAt || new Date().toISOString(),
            'dateModified': new Date().toISOString(),
            'author': {
              '@type': 'Person',
              'name': selectedArticle.author?.name || 'Redacción Trepola',
              'jobTitle': selectedArticle.author?.role || 'Periodista',
            },
            'publisher': {
              '@type': 'NewsMediaOrganization',
              'name': 'Trepola',
              'url': 'https://www.trepola.com',
              'logo': {
                '@type': 'ImageObject',
                'url': 'https://www.trepola.com/web-app-manifest-512x512.png',
                'width': 512,
                'height': 512,
              },
            },
            'articleSection': selectedArticle.category,
            'keywords': selectedArticle.seoKeywords?.join(', ') || 'AI, Tech, News',
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumb`,
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': 'https://www.trepola.com',
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': selectedArticle.category,
                'item': `https://www.trepola.com/categoria/${selectedArticle.category.toLowerCase()}`,
              },
              {
                '@type': 'ListItem',
                'position': 3,
                'name': artTitle,
                'item': canonicalUrl,
              },
            ],
          },
        ],
      };
    } else if (searchQuery.trim()) {
      title = `${searchQuery.trim()} - Search Results | Trepola`;
      description = `Explore search results for "${searchQuery.trim()}" on Trepola. Read breaking stories, AI technology, and local events.`;
    } else if (selectedCategory !== 'all') {
      const formattedCategory = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
      title = `${formattedCategory} News | Trepola`;
      description = `Discover top ${formattedCategory} stories, analysis, and breaking updates on Trepola. Fast, accurate, and up-to-date journalism.`;
      canonicalUrl = categoryCanonical(selectedCategory);
    } else if (activeTab === 'map') {
      title = 'Interactive Local News Map | Trepola';
      description = 'Explore interactive neighborhood news, local community updates, and real-time events on the Trepola Map.';
    } else if (activeTab === 'saved') {
      title = 'Saved Bookmarks & Reading List | Trepola';
      description = 'Access your bookmarked articles, saved stories, and personal reading list on Trepola.';
    }

    // Update Document Title
    document.title = title;

    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    // Update OpenGraph Title & Description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', imageUrl);

    // Update Twitter Tags
    const twTitle = document.querySelector('meta[property="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[property="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);

    const twImg = document.querySelector('meta[property="twitter:image"]');
    if (twImg) twImg.setAttribute('content', imageUrl);

    // Update Canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
      canonicalTag.setAttribute('href', canonicalUrl);
    }

    // Inject Dynamic JSON-LD Schema Script
    // On /news/:slug the server already injected richer structured data
    // (NewsArticle + BreadcrumbList + FAQPage, multiple image aspect ratios)
    // into the HTML, tagged data-ssr. This effect runs before the article
    // list finishes loading from the API, so `jsonLd` is still null on that
    // first pass — the previous code therefore *deleted* the server's schema
    // on every article page load, then replaced it with a poorer client-side
    // version. Never touch a server-rendered node: it is both more complete
    // and already present in the HTML Google receives.
    let schemaScript = document.getElementById('dynamic-jsonld-schema');
    if (schemaScript?.hasAttribute('data-ssr')) {
      return;
    }
    if (jsonLd) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'dynamic-jsonld-schema';
        schemaScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(jsonLd);
    } else if (schemaScript) {
      schemaScript.remove();
    }
  }, [language, activeTab, selectedCategory, selectedArticle, searchQuery, activeFooterPage]);

  return null;
};
