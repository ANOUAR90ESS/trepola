
import React from 'react';
import { 
  MapPin, 
  Search, 
  Bookmark, 
  Bell, 
  Sun, 
  Moon, 
  Map as MapIcon,
  LayoutGrid,
  Settings,
  Lock,
  LogOut,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { Language, CITIES_DATA, CATEGORIES_LIST, UI_STRINGS } from '../i18n/translations';
import { useAuth } from '../lib/auth-context.tsx';

interface NavbarProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  currentCategoryId: string;
  onSelectCategory: (catId: string) => void;
  selectedDistrictId: string;
  onSelectDistrict: (districtId: string) => void;
  activeTab: 'feed' | 'map' | 'saved' | 'admin';
  onChangeTab: (tab: 'feed' | 'map' | 'saved' | 'admin') => void;
  savedCount: number;
  urgentAlertsCount: number;
  onOpenSearch: () => void;
  onOpenAlerts: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  language,
  onSelectLanguage,
  selectedCityId,
  onSelectCity,
  currentCategoryId,
  onSelectCategory,
  selectedDistrictId,
  onSelectDistrict,
  activeTab,
  onChangeTab,
  savedCount,
  urgentAlertsCount,
  onOpenSearch,
  onOpenAlerts,
  darkMode,
  onToggleDarkMode,
}) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const { user, signOut } = useAuth();
  const isAdminAuthenticated = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-t-4 border-red-600 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & City Badge */}
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <button 
            onClick={() => onChangeTab('feed')}
            className="flex flex-col shrink-0"
          >
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
              Trepola
              <span className="text-red-600">.</span>
            </span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <select 
                value={language}
                onChange={(e) => onSelectLanguage(e.target.value as Language)}
                aria-label="Seleccionar idioma"
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="es" className="bg-white dark:bg-slate-800">Español</option>
                <option value="en" className="bg-white dark:bg-slate-800">English</option>
                <option value="ar" className="bg-white dark:bg-slate-800">العربية</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search, Alerts, Theme, Admin */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={onOpenSearch}
            aria-label="Buscar noticias"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAlerts}
            aria-label="Alertas de emergencia"
            className="relative p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {urgentAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            )}
          </button>

          <button
            onClick={onToggleDarkMode}
            aria-label="Alternar modo oscuro"
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* Auth section */}
          {user && (
            <div className="flex items-center gap-2">
              {isAdminAuthenticated && (
                <button
                  onClick={() => onChangeTab(activeTab === 'admin' ? 'feed' : 'admin')}
                  aria-label="Panel de Administración"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">{strings.adminPanel}</span>
                </button>
              )}
              
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center justify-center border border-slate-200 uppercase">
                {user.email.substring(0, 2)}
              </div>
              <button
                onClick={signOut}
                aria-label="Cerrar sesión"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-500 hover:text-red-600 dark:text-slate-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Category Filter Tabs Slider */}
      {activeTab === 'feed' && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto scrollbar-none py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
            {CATEGORIES_LIST.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  currentCategoryId === cat.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50'
                }`}
              >
                {cat.name[language] || cat.name.es}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
});

Navbar.displayName = 'Navbar';
