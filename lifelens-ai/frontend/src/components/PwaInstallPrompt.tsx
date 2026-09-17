import React, { useEffect, useState } from 'react';
import { AppLogo } from './AppLogo';
import { Download, X } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 glass-card p-4 rounded-2xl border border-sky-500/40 shadow-2xl bg-slate-900/95 backdrop-blur-lg flex items-center justify-between gap-3 animate-bounce-short">
      <div className="flex items-center gap-3">
        <AppLogo className="w-10 h-10 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-white">Install NEXORA AI App</h4>
          <p className="text-[11px] text-slate-400">Add to your Android home screen</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-1.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 text-white text-xs shadow-md flex items-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
