import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <aside
      id="banner-offline"
      aria-label="Offline Mode status"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl bg-amber-900/95 text-amber-50 p-4 shadow-xl border-2 border-amber-400 flex items-center gap-3 backdrop-blur-sm"
    >
      <div className="p-2.5 rounded-xl bg-amber-800 text-amber-200">
        <WifiOff className="w-6 h-6" />
      </div>
      <div className="text-left flex-1">
        <p className="font-bold text-lg leading-tight">You are currently offline</p>
        <p className="text-sm text-amber-200">No problem. Tada practice room and emergency contacts work offline.</p>
      </div>
    </aside>
  );
};
