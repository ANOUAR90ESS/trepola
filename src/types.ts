export type Language = 'es' | 'en' | 'ar';

export type ArticleCategory = string;
export type Neighborhood = string;

export interface LocationPoint {
  lat: number;
  lng: number;
  addressName: string;
}

export interface Author {
  name: string;
  avatar: string;
  role: string;
}

export interface Article {
  id: string;
  slug?: string;
  title: string | { es: string; en: string; ar: string };
  excerpt: string | { es: string; en: string; ar: string };
  content: string | { es: string; en: string; ar: string };
  category: ArticleCategory;
  neighborhood: string;
  cityId?: string;
  imageUrl: string;
  imageAspect?: '16:9' | '4:3' | '1:1';
  publishedAt: string;
  updatedAt?: string;
  author?: Author;
  authorBio?: string;
  readTimeMinutes: number;
  isUrgent: boolean;
  urgentSeverity?: 'high' | 'medium' | 'low';
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  seoKeywords: string[];
  metaDescription: string;
  location?: LocationPoint;
  eventDate?: string;
  eventTime?: string;
  source?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  isNeighborhoodResident?: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string | { es: string; en: string; ar: string };
  description: string | { es: string; en: string; ar: string };
  category: ArticleCategory;
  neighborhood: string;
  cityId?: string;
  lat: number;
  lng: number;
  address: string;
  date: string;
  time: string;
  organizer: string;
  attendeesCount: number;
  imageUrl: string;
  articleId?: string;
}

export interface EmergencyAlert {
  id: string;
  title: string | { es: string; en: string; ar: string };
  summary: string | { es: string; en: string; ar: string };
  type: 'weather' | 'traffic' | 'municipal' | 'security';
  neighborhood: string;
  cityId?: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  active: boolean;
}

export interface GoogleNewsImportItem {
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  source: string;
}

export interface AIGenerateRequest {
  topic: string;
  neighborhood: string;
  category: ArticleCategory;
  keywords?: string;
  styleTone?: string;
}

export interface AIImageRequest {
  prompt: string;
  style?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

