import React, { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { Language } from '../i18n/translations';

interface PrivacyCookieBannerProps {
  language: Language;
  onOpenPrivacyPage: () => void;
}

export const PrivacyCookieBanner: React.FC<PrivacyCookieBannerProps> = ({ language, onOpenPrivacyPage }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted or declined cookies
    const cookieConsent = localStorage.getItem('trepola_cookie_consent');
    if (!cookieConsent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('trepola_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('trepola_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isRtl = language === 'ar';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className={`max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 pointer-events-auto flex flex-col md:flex-row items-center gap-4 ${isRtl ? 'text-right' : 'text-left'}`}>
        <div className="flex-shrink-0 bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full">
          <Cookie className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {isRtl ? 'إشعار الخصوصية وملفات تعريف الارتباط' : language === 'es' ? 'Aviso de Privacidad y Cookies' : 'Privacy & Cookie Policy'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isRtl 
              ? 'نستخدم ملفات تعريف الارتباط وتقنيات التتبع لتحسين تجربة تصفحك على موقعنا، وتقديم محتوى مخصص، وتحليل حركة المرور. بالضغط على "موافق"، فإنك توافق على استخدامنا لملفات تعريف الارتباط وفقاً لـ'
              : language === 'es'
              ? 'Utilizamos cookies y tecnologías de seguimiento para mejorar tu experiencia de navegación, ofrecer contenido personalizado y analizar el tráfico. Al hacer clic en "Aceptar", aceptas nuestro uso de cookies de acuerdo con nuestra'
              : 'We use cookies and similar tracking technologies to improve your browsing experience, provide personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies in accordance with our'}
            {' '}
            <button 
              onClick={(e) => {
                e.preventDefault();
                onOpenPrivacyPage();
              }}
              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
            >
              {isRtl ? 'سياسة الخصوصية' : language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
            </button>
            .
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={handleDecline}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {isRtl ? 'رفض' : language === 'es' ? 'Rechazar' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
          >
            {isRtl ? 'موافق' : language === 'es' ? 'Aceptar' : 'Accept'}
          </button>
        </div>
        
        <button 
          onClick={handleDecline}
          className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
