'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

type Platform = 'android' | 'ios' | null;

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed
    if ((window.navigator as any).standalone === true) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setPlatform('android');
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDismissed(true);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
  };

  if (!platform || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#0D1F0D]/95 backdrop-blur-xl shadow-2xl p-4 flex gap-3 items-start">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          {platform === 'ios' ? <Share className="w-5 h-5 text-emerald-400" /> : <Download className="w-5 h-5 text-emerald-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install Eriyadan</p>
          {platform === 'ios' ? (
            <p className="text-xs text-white/50 mt-0.5">
              Tap <Share className="w-3 h-3 inline" /> Share then <strong className="text-white/70">Add to Home Screen</strong> for the full app experience.
            </p>
          ) : (
            <p className="text-xs text-white/50 mt-0.5">Install as an app for faster access and offline capability.</p>
          )}
          {platform === 'android' && (
            <button
              onClick={handleInstall}
              className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              Install App
            </button>
          )}
        </div>
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
