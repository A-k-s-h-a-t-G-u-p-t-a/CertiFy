'use client';

import { useState, useEffect } from 'react';

export default function PWATestInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      console.log('beforeinstallprompt fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  const forceReload = () => {
    // Clear all caches and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }
    
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  };

  return (
    <div className="fixed top-4 right-4 bg-blue-500 text-white p-4 rounded shadow-lg z-50">
      <div className="text-sm mb-2">PWA Install Test</div>
      <div className="text-xs mb-2">
        Can Install: {canInstall ? '✅ Yes' : '❌ No'}
      </div>
      <div className="space-y-2">
        {canInstall && (
          <button 
            onClick={handleInstall}
            className="block w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            🚀 Install Now
          </button>
        )}
        <button 
          onClick={forceReload}
          className="block w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          🔄 Reset & Reload
        </button>
      </div>
    </div>
  );
}