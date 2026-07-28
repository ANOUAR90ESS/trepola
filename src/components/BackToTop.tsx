import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = React.memo(() => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      title="Volver arriba"
      className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-hidden focus:ring-4 focus:ring-rose-400 dark:focus:ring-rose-800 animate-fade-in"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
});

BackToTop.displayName = 'BackToTop';
