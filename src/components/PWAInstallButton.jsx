'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install prompt result:', outcome);
        if (outcome === 'accepted') {
          setCanInstall(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
      }
    } else {
      // Show a more helpful dialog with multiple options
      const installInstructions = `Install CertiFy PWA:

🌐 Chrome/Edge:
   1. Click ⋮ menu (top-right)
   2. Select "Install CertiFy..."
   
🌐 Alternative (Chrome/Edge):
   1. Press Ctrl+Shift+I (DevTools)
   2. Go to "Application" tab
   3. Click "Manifest" → "Install"

📱 Mobile Safari:
   1. Tap Share button
   2. Select "Add to Home Screen"

🦊 Firefox:
   1. Click ☰ menu
   2. Select "Install"

💡 If you don't see install options, the app might already be installed or your browser doesn't support PWA installation.`;

      alert(installInstructions);
    }
  };

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="text-xs px-2 py-1"
    >
      📱 {canInstall ? 'Install App' : 'Install Guide'}
    </Button>
  );
}