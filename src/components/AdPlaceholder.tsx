import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/translations';
import { X } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdPlaceholderProps {
  language: Language;
  format?: 'rectangle' | 'horizontal' | 'vertical' | 'in-article-p3' | 'sticky-footer';
  className?: string;
  adSlot?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = React.memo(({ 
  language, 
  format = 'rectangle',
  className = '',
  adSlot = '3426115392'
}) => {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const pushAd = () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch {
        // Ignore if AdBlocker blocks the push
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(pushAd, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }

    const timeoutId = setTimeout(pushAd, 1);
    return () => clearTimeout(timeoutId);
  }, []);

  if (closed) return null;

  if (format === 'sticky-footer') {
    // AdSense's full-width-responsive script rewrites its immediate fixed-position
    // ancestor's inline style (height/min-height) with !important, overriding any
    // height we set on that element directly. This outer div is a plain wrapper
    // Google's script has no reason to touch; it clips whatever height the inner
    // div gets resized to, so the fixed element Lighthouse tracks never moves.
    return (
      <div className="fixed bottom-0 inset-x-0 z-50" style={{ height: '90px', overflow: 'hidden' }}>
        <div className={`h-full bg-slate-900 border-t border-slate-700 shadow-2xl flex items-center justify-center ${className}`}>
          <button
            onClick={() => setClosed(true)}
            aria-label="Cerrar anuncio"
            className="absolute top-1 right-2 p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-full max-w-4xl mx-auto overflow-hidden">
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-9054863881104831"
                 data-ad-slot={adSlot}
                 data-ad-format="horizontal"
                 data-full-width-responsive="true"></ins>
          </div>
        </div>
      </div>
    );
  }

  let adHeight = '250px';
  let googleAdFormat = 'auto';
  let currentAdSlot = adSlot;
  // 'autorelaxed' (in-article) ads are intentionally variable-height by Google's
  // own design, meant to flow with article content -- clipping them would cut
  // the creative off mid-content, so only the fixed-shape formats get clipped.
  let clip = true;

  if (format === 'horizontal') adHeight = '120px';
  if (format === 'vertical') adHeight = '600px';
  if (format === 'in-article-p3') {
    adHeight = '150px';
    googleAdFormat = 'autorelaxed';
    clip = false;
    if (adSlot === '3426115392') {
      currentAdSlot = '8602420455';
    }
  }

  // Same AdSense full-width-responsive quirk as the sticky-footer ad: Google's
  // script overrides this element's own inline height with !important, so the
  // hard height/overflow clip has to live on a plain outer div it never touches.
  return (
    <div className="w-full mx-auto" style={clip ? { height: adHeight, overflow: 'hidden' } : undefined}>
      <div
        className={`relative overflow-hidden w-full h-full mx-auto bg-slate-50 dark:bg-slate-800/30 rounded-xl flex items-center justify-center ${className}`}
        style={clip ? undefined : { minHeight: adHeight }}
      >
        <div className="w-full h-full">
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-9054863881104831"
               data-ad-slot={currentAdSlot}
               data-ad-format={googleAdFormat}
               data-full-width-responsive="true"></ins>
        </div>
      </div>
    </div>
  );
});

AdPlaceholder.displayName = 'AdPlaceholder';

