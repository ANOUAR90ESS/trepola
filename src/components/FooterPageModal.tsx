import React from 'react';
import { X, Send } from 'lucide-react';
import { Language, UI_STRINGS } from '../i18n/translations';

interface FooterPageModalProps {
  pageId: 'terms' | 'privacy' | 'about' | 'cookie' | 'security' | 'contact';
  language: Language;
  onClose: () => void;
}

export const FooterPageModal: React.FC<FooterPageModalProps> = ({ pageId, language, onClose }) => {
  const isRtl = language === 'ar';
  
  const renderContent = () => {
    switch (pageId) {
      case 'about':
        return (
          <>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Welcome to Trepola, your trusted digital news platform delivering real-time coverage on technology, artificial intelligence, sports, business, and local events.
            </p>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Our mission is to provide fast, reliable, and unbiased journalism tailored for a modern global audience.
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Our Vision</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              We envision a connected news ecosystem where readers receive verified breaking news and in-depth analysis across multiple languages and regions effortlessly.
            </p>
          </>
        );
      case 'privacy':
        return (
          <>
            <p className="text-xs text-slate-500 mb-6 font-bold">Last updated: July 26, 2026</p>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Welcome to Trepola (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you visit <strong className="text-slate-900 dark:text-white">https://trepola.com</strong>.
            </p>
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Information We Collect</h3>
            <p className="mb-2 text-slate-700 dark:text-slate-300">We may collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300">
              <li>Personal information you voluntarily provide, such as your name and email address when contacting us or subscribing to newsletters.</li>
              <li>Technical information including IP address, browser type, operating system, device information, and pages visited.</li>
              <li>Cookies and similar technologies used to improve website functionality, analytics, and advertising.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">How We Use Your Information</h3>
            <p className="mb-2 text-slate-700 dark:text-slate-300">We use collected information to:</p>
            <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-700 dark:text-slate-300">
              <li>Provide and improve our services.</li>
              <li>Respond to inquiries and customer support requests.</li>
              <li>Analyze website traffic and user behavior.</li>
              <li>Personalize content and user experience.</li>
              <li>Display relevant advertising.</li>
              <li>Detect fraud and protect website security.</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Cookies</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Trepola uses cookies to improve your browsing experience. Cookies help us understand visitor behavior, remember preferences, and provide relevant advertising. You may disable cookies through your browser settings; however, some features of the website may not function properly.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Google Services</h3>
            <p className="mb-2 text-slate-700 dark:text-slate-300">Our website may use Google services, including but not limited to:</p>
            <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-700 dark:text-slate-300">
              <li>Google AdSense</li>
              <li>Google Analytics</li>
              <li>Google Search Console</li>
              <li>Google Publisher Center</li>
              <li>Google Reader Revenue Manager / Subscribe with Google</li>
            </ul>
            <p className="mb-4 text-slate-700 dark:text-slate-300">These services may collect information according to Google&apos;s own Privacy Policy.</p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Third-Party Services</h3>
            <p className="mb-2 text-slate-700 dark:text-slate-300">We may use trusted third-party providers for:</p>
            <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-700 dark:text-slate-300">
              <li>Website hosting</li>
              <li>Analytics</li>
              <li>Payment processing</li>
              <li>Email communication</li>
              <li>Security services</li>
            </ul>
            <p className="mb-4 text-slate-700 dark:text-slate-300">These providers only process information necessary to perform their services.</p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Data Security</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              We implement reasonable administrative, technical, and organizational measures to protect your information against unauthorized access, disclosure, alteration, or destruction.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Your Rights</h3>
            <p className="mb-2 text-slate-700 dark:text-slate-300">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-700 dark:text-slate-300">
              <li>Access your personal information.</li>
              <li>Correct inaccurate information.</li>
              <li>Request deletion of your data.</li>
              <li>Restrict or object to processing.</li>
              <li>Withdraw consent where applicable.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Children&apos;s Privacy</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Trepola is not intended for children under the age of 13. We do not knowingly collect personal information from children.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Changes to This Policy</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated revision date.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Contact</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              If you have any questions regarding this Privacy Policy, please contact us through the contact page available on Trepola.
            </p>
          </>
        );
      case 'terms':
        return (
          <>
            <p className="text-xs text-slate-500 mb-6 font-bold">Last updated: July 26, 2026</p>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Welcome to Trepola. By accessing or using <strong className="text-slate-900 dark:text-white">https://trepola.com</strong>, you agree to comply with these Terms of Service.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Acceptance of Terms</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              By using this website, you agree to these Terms. If you do not agree, please discontinue using the website.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Use of the Website</h3>
            <p className="mb-2 text-slate-700 dark:text-slate-300">
              You agree to use Trepola only for lawful purposes and in a manner that does not infringe upon the rights of others. You must not:
            </p>
            <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-700 dark:text-slate-300">
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Distribute malicious software.</li>
              <li>Interfere with website functionality.</li>
              <li>Copy or redistribute content without permission.</li>
            </ul>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Intellectual Property</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Unless otherwise stated, all articles, graphics, logos, branding, and other content published on Trepola are protected by copyright and intellectual property laws. You may not reproduce, distribute, modify, or republish our content without prior written permission.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Third-Party Links</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Our website may contain links to external websites. We are not responsible for the content, security, or privacy practices of third-party websites.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Advertising</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Trepola may display advertisements from Google and other advertising partners. We are not responsible for products or services offered by advertisers.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Disclaimer</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              All information published on Trepola is provided for informational purposes only. While we strive for accuracy, we do not guarantee that all content is complete, accurate, or up to date.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Limitation of Liability</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              To the maximum extent permitted by law, Trepola shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of this website.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Changes to These Terms</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              We reserve the right to modify these Terms at any time. Updated versions will be posted on this page.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Governing Law</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              These Terms shall be governed by the applicable laws of the jurisdiction in which Trepola operates, without regard to conflict of law principles.
            </p>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Contact</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              For questions regarding these Terms of Service, please contact us through the contact page on Trepola.
            </p>
          </>
        );
      case 'cookie':
        return (
          <>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Trepola uses cookies and similar technologies to enhance your experience, analyze site traffic, and personalize content.
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Types of Cookies We Use</h3>
            <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300">
              <li><strong>Essential Cookies:</strong> Necessary for the website to function properly.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the site.</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and language settings.</li>
            </ul>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              You can manage your cookie preferences in your browser settings.
            </p>
          </>
        );
      case 'security':
        return (
          <>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              Security is at the core of Trepola infrastructure.
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Encryption</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              All data transmitted between your browser and our servers is encrypted using HTTPS and TLS 1.3.
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Compliance</h3>
            <p className="mb-4 text-slate-700 dark:text-slate-300">
              We conduct regular security audits and maintain strict access controls to ensure your data remains safe.
            </p>
          </>
        );
      case 'contact':
        return (
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'للتواصل مع هيئة التحرير، افتح تطبيق البريد الإلكتروني باستخدام الرابط أدناه. لا تُرسل أي رسالة من هذه الصفحة تلقائيًا.' : language === 'es' ? 'Contacta con la redacción desde tu aplicación de correo. Esta página no envía mensajes automáticamente.' : 'Contact the editorial team using your email app. This page does not send messages automatically.'}
            </p>
            <a href="mailto:contact@trepola.com" className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold underline" dir="ltr">
              <Send className="w-4 h-4" /> contact@trepola.com
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  const titles = {
    es: { about: 'Acerca de Trepola', privacy: 'Política de privacidad', terms: 'Términos de servicio', cookie: 'Política de cookies', security: 'Seguridad', contact: 'Contacto' },
    en: { about: 'About Trepola', privacy: 'Privacy Policy', terms: 'Terms of Service', cookie: 'Cookie Policy', security: 'Security', contact: 'Contact Us' },
    ar: { about: 'عن المنصة', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام', cookie: 'سياسة ملفات الارتباط', security: 'الأمان', contact: 'اتصل بنا' },
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={titles[language][pageId]} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {titles[language][pageId]}
          </h2>
          <button
            aria-label={UI_STRINGS[language].close}
            onClick={onClose}
            className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div lang={pageId === 'contact' ? language : 'en'} dir={pageId === 'contact' && isRtl ? 'rtl' : 'ltr'} className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
            {pageId !== 'contact' && language !== 'en' && <p className="mb-4 text-slate-500" dir={isRtl ? 'rtl' : 'ltr'}>{isRtl ? 'هذا المحتوى متاح حاليًا باللغة الإنجليزية.' : 'Este contenido está disponible actualmente en inglés.'}</p>}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
