'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      console.log('beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the custom install prompt
      setShowInstallPrompt(true);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For debugging - show install button after 3 seconds if no prompt appears
    const debugTimer = setTimeout(() => {
      if (!isInstallable) {
        console.log('No beforeinstallprompt event detected, showing debug install option');
        setShowInstallPrompt(true);
      }
    }, 3000);

    // Clean up the event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(debugTimer);
    };
  }, [isInstallable]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      alert('To install this app:\n\n• Chrome: Click the install icon in the address bar\n• Edge: Click the app icon in the address bar\n• Safari: Use "Add to Home Screen" from the share menu\n• Firefox: Use "Install" from the page menu');
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response to the install prompt: ${outcome}`);

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img
            src="/icon-72x72.png"
            alt="CertiFy Logo"
            className="w-12 h-12 rounded-lg"
            onError={(e) => {
              e.target.src = "/certify-logo.png";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            Install CertiFy {!isInstallable && '(Debug Mode)'}
          </h3>
          <p className="text-sm text-gray-500">
            {isInstallable 
              ? "Install this app to access it quickly and work offline."
              : "Check browser's address bar for install option or use browser menu."
            }
          </p>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <Button 
          onClick={handleInstallClick}
          size="sm"
          className="flex-1"
        >
          {isInstallable ? 'Install' : 'Show Install Instructions'}
        </Button>
        <Button 
          onClick={handleDismiss}
          variant="outline"
          size="sm"
        >
          Not now
        </Button>
      </div>
    </div>
  );
}