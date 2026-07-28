/**
 * Dynamic Image Optimization & Responsive SrcSet Helper
 * Converts image URLs (especially Unsplash) to WebP format with exact dimensions,
 * optimal compression, and generates srcset/sizes attributes for modern responsive rendering.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif';
  fit?: 'crop' | 'cover' | 'fill';
}

/**
 * Transforms an image URL to deliver optimized WebP/AVIF images.
 */
export function getOptimizedImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
  if (!url) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&q=60&fm=webp';
  
  const { width = 640, quality = 60, format = 'webp', fit = 'crop' } = options;

  // Handle Unsplash CDN URLs
  if (url.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', fit);
      parsedUrl.searchParams.set('fm', format);
      parsedUrl.searchParams.set('w', width.toString());
      parsedUrl.searchParams.set('q', quality.toString());
      if (options.height) {
        parsedUrl.searchParams.set('h', options.height.toString());
      }
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Generates responsive srcset attribute string for Unsplash and responsive image CDNs.
 */
export function getSrcSet(url: string, widths: number[] = [240, 360, 480, 640, 800], quality: number = 60): string {
  if (!url || !url.includes('images.unsplash.com')) return '';

  return widths
    .map((w) => `${getOptimizedImageUrl(url, { width: w, quality, format: 'webp' })} ${w}w`)
    .join(', ');
}

/**
 * Standard responsive sizes attribute default based on layout usage.
 */
export function getImageSizes(layout: 'hero' | 'card' | 'avatar' | 'modal' | 'ad' = 'card'): string {
  switch (layout) {
    case 'hero':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 720px';
    case 'card':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 360px';
    case 'modal':
      return '(max-width: 768px) 100vw, 800px';
    case 'avatar':
      return '32px';
    case 'ad':
      return '(max-width: 640px) 100vw, 300px';
    default:
      return '100vw';
  }
}
