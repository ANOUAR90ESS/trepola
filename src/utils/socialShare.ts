import { Article } from '../types';
import { getLocalizedField } from './i18nHelpers';
import { getArticleUrl } from './slug';

export interface SocialShareLinks {
  whatsapp: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  telegram: string;
  email: string;
}

export function getSocialShareLinks(article: Article, lang: 'es' | 'en' | 'ar' = 'es'): SocialShareLinks {
  const url = encodeURIComponent(getArticleUrl(article, lang));
  const rawTitle = getLocalizedField(article.title, lang);
  const title = encodeURIComponent(rawTitle);
  const excerpt = encodeURIComponent(getLocalizedField(article.excerpt, lang));

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${title}%20${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}&via=TrepolaNews`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${title}`,
    email: `mailto:?subject=${title}&body=${excerpt}%0A%0ALeer%20m%C3%A1s%20en:%20${url}`,
  };
}
