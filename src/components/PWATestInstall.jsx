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

  const forceReload = async () => {
    console.log('Force reload initiated...');
    
    // Clear all caches and reload
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
        console.log('Service workers unregistered');
      } catch (error) {
        console.error('Error unregistering service workers:', error);
      }
    }
    
    // Clear all caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('All caches cleared');
      } catch (error) {
        console.error('Error clearing caches:', error);
      }
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('Reloading page...');
    setTimeout(() => {
      window.location.href = window.location.href;
    }, 500);
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