import React, { useState } from 'react';
import { Radio, Mail, Shield, Globe2, FileText, CheckCircle2, ArrowRight, ArrowLeft, Send, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth-context.tsx';
import { Language, UI_STRINGS, CITIES_DATA, CATEGORIES_LIST } from '../i18n/translations';

interface FooterProps {
  language: Language;
  selectedCityId: string;
  onOpenAlerts: () => void;
  onOpenPage?: (pageId: 'terms' | 'privacy' | 'about' | 'cookie' | 'security' | 'contact') => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = React.memo(({ language, selectedCityId, onOpenPage, onOpenAdminLogin }) => {
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const currentCity = CITIES_DATA.find((c) => c.id === selectedCityId) || CITIES_DATA[0];
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const isRtl = language === 'ar';
  const { signIn, user } = useAuth();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="mt-20 bg-slate-950 text-slate-300 border-t border-slate-800/80 transition-colors">
      {/* Top Newsletter Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-start">
            <h3 className="text-base font-black text-white flex items-center gap-2 justify-center md:justify-start">
              <Mail className="w-4 h-4 text-rose-500" />
              {isRtl ? 'النشرة الإخبارية اليومية' : language === 'es' ? 'Boletín de Noticias Diario' : 'Daily News Bulletin'}
            </h3>
            <p className="text-xs text-slate-400">
              {isRtl
                ? 'احصل على أهم الأخبار والتحليلات العاجلة مباشرة في بريدك الإلكتروني.'
                : language === 'es'
                ? 'Recibe las noticias más importantes y exclusivas directamente en tu correo.'
                : 'Get top breaking stories and exclusive analysis directly to your inbox.'}
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full md:w-auto max-w-md">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRtl ? 'أدخل بريدك الإلكتروني...' : language === 'es' ? 'Tu correo electrónico...' : 'Enter your email...'}
                className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <span>{subscribed ? (isRtl ? 'تم الاشتراك!' : '¡Suscrito!') : (isRtl ? 'اشترك الآن' : language === 'es' ? 'Suscribirse' : 'Subscribe')}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Column 1: Brand & Statement */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-900/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-2xl text-white tracking-tight block leading-tight">
                  {strings.appName}
                </span>
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  {isRtl ? 'مؤسسة إعلامية مستقلة' : language === 'es' ? 'Red de Medios Independiente' : 'Independent Media Network'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {strings.tagline}. {isRtl ? 'تغطية مستمرة وموثوقة بأعلى المعايير الصحفية العالمية.' : language === 'es' ? 'Periodismo verificado local e internacional las 24 horas.' : 'Delivering verified local and international journalism 24/7.'}
            </p>

            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-slate-900 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {isRtl ? 'صحافة موثقة' : language === 'es' ? 'Periodismo Verificado' : 'Verified News'}
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-900 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-800">
                <Globe2 className="w-3 h-3 text-rose-400" />
                {isRtl ? 'تغطية عالمية' : language === 'es' ? 'Red Global' : 'Global Network'}
              </span>
            </div>
          </div>

          {/* Column 2: News Sections */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 border-s-3 border-rose-600 ps-3">
              {isRtl ? 'الأقسام الإخبارية' : language === 'es' ? 'Secciones de Noticias' : 'News Sections'}
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
              {CATEGORIES_LIST.filter(c => c.id !== 'all').map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#cat-${cat.id}`}
                    className="hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>{cat.name[language]}</span>
                    <span className="text-[10px] text-slate-600 group-hover:text-rose-400 transition-colors">
                      {isRtl ? '←' : '→'}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Editorial Desk & Legal */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm mb-4 border-s-3 border-rose-600 ps-3">
              {isRtl ? 'المكتب الإعلامي والتحرير' : language === 'es' ? 'Redacción y Contacto' : 'Editorial Desk'}
            </h4>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                <Send className="w-3.5 h-3.5 text-rose-500" />
                <span>{isRtl ? 'تواصل مع هيئة التحرير' : language === 'es' ? 'Contacto con la Redacción' : 'Editorial Inquiries'}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                contact@trepola.com
              </p>
            </div>

            <div className="space-y-2 text-xs font-medium text-slate-400 pt-1">
              <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                <span onClick={() => onOpenPage?.('about')} className="hover:text-white cursor-pointer transition-colors">
                  {language === 'es' ? 'Acerca de Trepola' : language === 'ar' ? 'عن المنصة' : 'About Trepola'}
                </span>
                <span onClick={() => onOpenPage?.('privacy')} className="hover:text-white cursor-pointer transition-colors text-right rtl:text-left">
                  {language === 'es' ? 'Privacidad' : language === 'ar' ? 'الخصوصية' : 'Privacy Policy'}
                </span>
                <span onClick={() => onOpenPage?.('terms')} className="hover:text-white cursor-pointer transition-colors">
                  {language === 'es' ? 'Términos' : language === 'ar' ? 'الشروط' : 'Terms of Service'}
                </span>
                <span onClick={() => onOpenPage?.('cookie')} className="hover:text-white cursor-pointer transition-colors text-right rtl:text-left">
                  {language === 'es' ? 'Cookies' : language === 'ar' ? 'ملفات الارتباط' : 'Cookie Policy'}
                </span>
                <span onClick={() => onOpenPage?.('security')} className="hover:text-white cursor-pointer transition-colors">
                  {language === 'es' ? 'Seguridad' : language === 'ar' ? 'الأمان' : 'Security'}
                </span>
                <span onClick={() => onOpenPage?.('contact')} className="hover:text-white cursor-pointer transition-colors text-right rtl:text-left">
                  {language === 'es' ? 'Contacto' : language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-400">
              © {new Date().getFullYear()} {strings.appName}. {isRtl ? 'جميع الحقوق محفوظة.' : language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>ISO 9001 Journalism Standard</span>
            <span>•</span>
            <span>SSL Encrypted</span>
            {!user && (
              <button 
                onClick={onOpenAdminLogin} 
                className="hover:text-slate-300 transition-colors p-1 rounded-sm hover:bg-slate-900" 
                title="Acceso Admin"
                aria-label="Acceso Administrador"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
