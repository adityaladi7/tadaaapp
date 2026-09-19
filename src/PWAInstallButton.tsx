import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        id="btn-pwa-install"
        onClick={handleInstallClick}
        aria-label="Add Tada to Phone Screen"
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border-2 border-amber-300 transition-colors shadow-xs text-sm min-h-[48px]"
      >
        <Download className="w-5 h-5 text-amber-800" />
        <span>Add to Phone</span>
      </button>

      {showIOSModal && (
        <div
          id="modal-ios-install"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#FFFDF7] p-6 text-[#1A1816] shadow-2xl border-2 border-amber-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-amber-950 mb-3 font-display">
              Add Tada to your iPhone / iPad
            </h3>
            <div className="space-y-4 text-lg text-stone-800">
              <p>
                1. Tap the <strong>Share button</strong> at the bottom of your Safari screen (the square with an arrow pointing up).
              </p>
              <p>
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <p className="text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
                Tada will appear as a regular app on your phone. No passwords needed!
              </p>
            </div>
            <button
              id="btn-close-ios-modal"
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-4 text-xl min-h-[64px]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
