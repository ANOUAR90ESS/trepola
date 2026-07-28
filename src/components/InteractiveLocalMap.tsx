import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Compass, ChevronRight } from 'lucide-react';
import { CommunityEvent, Article } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';

interface InteractiveLocalMapProps {
  language: Language;
  events: CommunityEvent[];
  articles: Article[];
  selectedDistrictId: string;
  onSelectArticle: (article: Article) => void;
}

export const InteractiveLocalMap: React.FC<InteractiveLocalMapProps> = ({
  language,
  events,
  articles,
  selectedDistrictId,
  onSelectArticle,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'events' | 'urgent' | 'projects'>('all');
  const [selectedPinItem, setSelectedPinItem] = useState<{
    type: 'event' | 'article';
    title: string;
    description: string;
    neighborhood: string;
    address: string;
    date?: string;
    imageUrl: string;
    articleRef?: Article;
    isUrgent?: boolean;
  } | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        const L = (await import('leaflet')).default;

        // Default Spain center coordinates (Madrid)
        const defaultLat = 40.4168;
        const defaultLng = -3.7038;

        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: 12,
          zoomControl: false,
        });

        L.control.zoom({ position: 'topleft' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; Trepola Map',
        }).addTo(map);

        mapInstanceRef.current = map;
        renderMarkers(L);
      } catch (err) {
        console.error('Map init error:', err);
      }
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      import('leaflet').then((LModule) => {
        renderMarkers(LModule.default);
      });
    }
  }, [events, articles, activeFilter, selectedDistrictId, language]);

  const renderMarkers = (L: any) => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((m) => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    const mapItems: Array<{
      id: string;
      title: string;
      description: string;
      neighborhood: string;
      lat: number;
      lng: number;
      address: string;
      type: 'event' | 'article';
      imageUrl: string;
      articleRef?: Article;
      isUrgent?: boolean;
      date?: string;
    }> = [];

    // Add Events
    events.forEach((evt) => {
      if (activeFilter === 'urgent') return;

      const title = getLocalizedField(evt.title, language);
      const desc = getLocalizedField(evt.description, language);
      const relatedArt = articles.find((a) => a.id === evt.articleId);

      mapItems.push({
        id: evt.id,
        title,
        description: desc,
        neighborhood: evt.neighborhood,
        lat: evt.lat,
        lng: evt.lng,
        address: evt.address,
        type: 'event',
        imageUrl: evt.imageUrl,
        articleRef: relatedArt,
        date: `${evt.date} (${evt.time})`,
      });
    });

    // Add Articles with Location
    articles.forEach((art) => {
      if (!art.location) return;

      const title = getLocalizedField(art.title, language);
      const desc = getLocalizedField(art.excerpt, language);

      if (activeFilter === 'events' && art.category !== 'Cultura y Gastronomía') return;
      if (activeFilter === 'urgent' && !art.isUrgent) return;

      mapItems.push({
        id: art.id,
        title,
        description: desc,
        neighborhood: art.neighborhood,
        lat: art.location.lat,
        lng: art.location.lng,
        address: art.location.addressName,
        type: 'article',
        imageUrl: art.imageUrl,
        articleRef: art,
        isUrgent: art.isUrgent,
        date: art.publishedAt,
      });
    });

    mapItems.forEach((item) => {
      const isUrgent = item.isUrgent;
      const isEvent = item.type === 'event';

      const iconHtml = `
        <div style="
          background: ${isUrgent ? '#e11d48' : isEvent ? '#10b981' : '#2563eb'};
          color: white;
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>${isUrgent ? '🚨' : isEvent ? '🎉' : '📍'}</span>
          <span>${item.title.substring(0, 18)}...</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-pin',
        iconSize: [120, 36],
        iconAnchor: [60, 18],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(mapInstanceRef.current);

      marker.on('click', () => {
        setSelectedPinItem({
          type: item.type,
          title: item.title,
          description: item.description,
          neighborhood: item.neighborhood,
          address: item.address,
          date: item.date,
          imageUrl: item.imageUrl,
          articleRef: item.articleRef,
          isUrgent: item.isUrgent,
        });
      });

      markersRef.current.push(marker);
    });

    if (mapItems.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(mapItems.map((i) => [i.lat, i.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  return (
    <div className="my-6 bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col lg:flex-row min-h-[550px]">
      {/* Map Control & Filter Sidebar */}
      <div className="p-5 lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{strings.mapViewTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{strings.mapViewSubtitle}</p>
            </div>
          </div>

          {/* Filters list */}
          <div className="space-y-2 my-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">📍 {strings.allDistricts}</span>
            </button>

            <button
              onClick={() => setActiveFilter('events')}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeFilter === 'events'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">🎉 {strings.upcomingEventsTitle}</span>
            </button>
          </div>
        </div>

        {/* Selected Item Preview Box inside sidebar */}
        {selectedPinItem ? (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md space-y-2 animate-fade-in">
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
              <img
                src={selectedPinItem.imageUrl}
                alt={selectedPinItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-bold">
              <span>📍 {selectedPinItem.neighborhood}</span>
              {selectedPinItem.date && <span className="text-slate-400">• {selectedPinItem.date}</span>}
            </div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug">
              {selectedPinItem.title}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
              {selectedPinItem.description}
            </p>
            {selectedPinItem.articleRef && (
              <button
                onClick={() => onSelectArticle(selectedPinItem.articleRef!)}
                className="w-full mt-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <span>{strings.emergencyDetails}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 text-xs text-center border border-dashed border-slate-300 dark:border-slate-700">
            {strings.mapViewSubtitle}
          </div>
        )}
      </div>

      {/* Leaflet Canvas Container */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 relative z-0">
        <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />
      </div>
    </div>
  );
};
