import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  className?: string;
  adSlot?: string;
}

export default function AdBanner({ className = "", adSlot = "1234567890" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e: any) {
      if (!e.message?.includes('already have ads')) {
        console.error("AdSense error", e);
      }
    }
  }, []);

  return (
    <div className={`col-span-full w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 my-2 ${className}`}>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 font-semibold">Publicidad</span>
      
      {/* Contenedor del anuncio real */}
      <div className="w-full min-h-[90px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client="ca-pub-0000000000000000" // Reemplazar con el ID de AdSense real
          data-ad-slot={adSlot} // Reemplazar con el Slot real
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        
        {/* Placeholder visual para desarrollo (se oculta si el anuncio carga) */}
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 pointer-events-none text-center px-4">
          Espacio reservado para Banner Publicitario (AdSense)
        </div>
      </div>
    </div>
  );
}
